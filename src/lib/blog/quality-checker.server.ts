export interface QACheck {
  name: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
}

export interface QAResult {
  passed: boolean; // score >= 70
  score: number; // 0-100
  checks: QACheck[];
}

export interface DraftForQA {
  title: string;
  description: string;
  body_mdx: string;
  sources_used: number[];
  needs_source_count: number;
  primary_keyword: string;
}

// Helper: count syllables (simple approximation)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// Check 1: Citation Integrity (20%)
function checkCitations(draft: DraftForQA): QACheck {
  const body = draft.body_mdx || "";
  const citations = [...body.matchAll(/\[\^(\d+)\]/g)].map((m) => parseInt(m[1], 10));
  if (citations.length === 0) {
    return { name: "Citations", passed: true, score: 100, details: "No citations used." };
  }

  const sourcesUsed = draft.sources_used || [];
  const valid = citations.filter((c) => sourcesUsed.includes(c));
  const score = Math.round((valid.length / citations.length) * 100);
  return {
    name: "Citations",
    passed: score === 100,
    score,
    details: `${valid.length}/${citations.length} citations map to actual sources.`,
  };
}

// Check 2: Hallucination Markers (20%)
function checkMarkers(draft: DraftForQA): QACheck {
  const body = draft.body_mdx || "";
  const markerCount = (body.match(/\[NEEDS OFFICIAL SOURCE\]/gi) || []).length;
  const count = (draft.needs_source_count || 0) + markerCount;
  return {
    name: "Hallucination Markers",
    passed: count === 0,
    score: count === 0 ? 100 : 0,
    details: `Found ${count} [NEEDS OFFICIAL SOURCE] markers.`,
  };
}

// Check 3: Word Count (10%)
function checkWordCount(draft: DraftForQA, words: string[]): QACheck {
  const count = words.length;
  let score = 100;
  if (count < 800) score = Math.max(0, 100 - (800 - count) / 4);
  else if (count > 3500) score = Math.max(0, 100 - (count - 3500) / 10);

  return {
    name: "Word Count",
    passed: count >= 600 && count <= 4000,
    score: Math.round(score),
    details: `${count} words (Target: 800-3500).`,
  };
}

// Check 4: Readability (15%)
function checkReadability(draft: DraftForQA, words: string[]): QACheck {
  if (words.length === 0)
    return { name: "Readability", passed: false, score: 0, details: "Empty body." };
  const body = draft.body_mdx || "";
  const sentences = Math.max(1, body.split(/[.!?]+/).length - 1);
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  // Flesch-Kincaid Reading Ease
  let ease = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  ease = Math.max(0, Math.min(100, ease));

  let score = 100;
  if (ease < 50) score = Math.max(0, 100 - (50 - ease) * 2);
  else if (ease > 70) score = Math.max(0, 100 - (ease - 70) * 2);

  return {
    name: "Readability",
    passed: ease >= 30 && ease <= 80,
    score: Math.round(score),
    details: `Flesch-Kincaid score: ${Math.round(ease)} (Target: 50-70).`,
  };
}

// Check 5: Keyword Density (10%)
function checkDensity(draft: DraftForQA, words: string[]): QACheck {
  if (words.length === 0 || !draft.primary_keyword)
    return { name: "Density", passed: true, score: 100, details: "N/A" };
  const pk = draft.primary_keyword.toLowerCase();
  const body = (draft.body_mdx || "").toLowerCase();

  // Count occurrences safely (escape regex special characters)
  const escapedPk = pk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count = (body.match(new RegExp(escapedPk, "g")) || []).length;
  const density = (count / words.length) * 100;

  let score = 100;
  if (density < 0.8) score = Math.max(0, (density / 0.8) * 100);
  else if (density > 2.5) score = Math.max(0, 100 - (density - 2.5) * 40);

  return {
    name: "Keyword Density",
    passed: density >= 0.3 && density <= 4.0,
    score: Math.round(score),
    details: `${density.toFixed(2)}% (${count} occurrences).`,
  };
}

// Check 6: AI Tells (10%)
function checkAITells(draft: DraftForQA): QACheck {
  const banned = [
    "let's dive in",
    "in today's world",
    "in today's globalised",
    "navigate the complexities",
    "in conclusion",
    "it's worth noting",
    "it's important to note",
    "as an ai",
    "the visa process can be daunting",
    "fast, reliable, and seamless",
    "whether you're a .* or a",
    "imagine a world",
    "picture this",
    "in this comprehensive guide",
    "without further ado",
    "buckle up",
    "game-changer",
    "revolutionize",
    "unlock the power",
    "deep dive",
    "at the end of the day",
  ];

  const body = (draft.body_mdx || "").toLowerCase();
  let matches = 0;
  const found: string[] = [];

  for (const phrase of banned) {
    if (new RegExp(phrase).test(body)) {
      matches++;
      found.push(phrase.replace(/\\\.\*/g, "..."));
    }
  }

  const score = Math.max(0, 100 - matches * 20);
  return {
    name: "AI Tells",
    passed: matches === 0,
    score,
    details: matches === 0 ? "No banned phrases found." : `Found: ${found.join(", ")}`,
  };
}

// Check 7: SEO Meta (10%)
function checkSEO(draft: DraftForQA): QACheck {
  const tLen = (draft.title || "").length;
  const dLen = (draft.description || "").length;

  let tScore = 100;
  if (tLen < 30) tScore = Math.max(0, (tLen / 30) * 100);
  else if (tLen > 65) tScore = Math.max(0, 100 - (tLen - 65) * 2);

  let dScore = 100;
  if (dLen < 100) dScore = Math.max(0, (dLen / 100) * 100);
  else if (dLen > 165) dScore = Math.max(0, 100 - (dLen - 165));

  const score = Math.round((tScore + dScore) / 2);
  const passed = tLen >= 20 && tLen <= 80 && dLen >= 50 && dLen <= 200;

  return {
    name: "SEO Meta",
    passed,
    score,
    details: `Title: ${tLen} chars, Desc: ${dLen} chars.`,
  };
}

// Check 8: Duplicate Title (5%)
function checkDuplicate(draft: DraftForQA, existingTitles: string[] = []): QACheck {
  const normalize = (t: string) =>
    (t || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/);
  const draftWords = normalize(draft.title);

  for (const existing of existingTitles) {
    const exWords = normalize(existing);
    const overlap = draftWords.filter((w) => exWords.includes(w)).length;
    const similarity = overlap / Math.max(draftWords.length, exWords.length);
    if (similarity > 0.8) {
      return {
        name: "Unique Title",
        passed: false,
        score: 0,
        details: "Very similar to existing post.",
      };
    }
  }
  return { name: "Unique Title", passed: true, score: 100, details: "Title looks unique." };
}

/**
 * Runs the complete 8-check quality gate for a drafted blog post.
 */
export async function runQualityChecks(
  draft: DraftForQA,
  availableSources: Array<{ index: number; url: string; title: string }> = [],
  existingTitles: string[] = [],
): Promise<QAResult> {
  const body = draft.body_mdx || "";
  const words = body
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const checks: QACheck[] = [
    checkCitations(draft), // 20%
    checkMarkers(draft), // 20%
    checkWordCount(draft, words), // 10%
    checkReadability(draft, words), // 15%
    checkDensity(draft, words), // 10%
    checkAITells(draft), // 10%
    checkSEO(draft), // 10%
    checkDuplicate(draft, existingTitles), // 5%
  ];

  const weights = [0.2, 0.2, 0.1, 0.15, 0.1, 0.1, 0.1, 0.05];
  const score = Math.round(checks.reduce((acc, c, i) => acc + c.score * weights[i], 0));

  return {
    passed: score >= 70 && checks[1].passed, // MUST pass hallucination check
    score,
    checks,
  };
}

export default { runQualityChecks };
