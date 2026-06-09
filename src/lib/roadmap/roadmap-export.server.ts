import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

// Roadmap is opaque JSON — pull only the fields we know about, gracefully.
type AnyRoadmap = {
  visaType?: string;
  estimatedProcessingTime?: string;
  estimatedTotalCost?: string;
  difficulty?: string;
  summary?: string;
  steps?: Array<{
    order?: number;
    title?: string;
    description?: string;
    timeframe?: string;
    actionItems?: string[];
  }>;
  documents?: Array<{ name?: string; details?: string; critical?: boolean }>;
  financialRequirements?: Array<{ item?: string; amount?: string; note?: string }>;
  proTips?: string[];
  commonRejectionReasons?: string[];
  postArrival?: string[];
  sources?: Array<{ title?: string; url?: string }>;
};

type Input = {
  nationality: string;
  destination: string;
  purpose: string;
  roadmap: unknown;
};

/**
 * Replace characters that the built-in Helvetica (WinAnsi) cannot encode
 * with safe ASCII equivalents. Without this, exporting a roadmap with
 * "→", "·", "—", "•" etc. crashes pdf-lib at draw time.
 */
function toWinAnsi(s: string): string {
  if (!s) return "";
  return s
    .replace(/\u2192|\u27a4|\u279c|\u279e/g, "->") // → arrow variants
    .replace(/\u2190/g, "<-")
    .replace(/\u2194/g, "<->")
    .replace(/\u21d2/g, "=>")
    .replace(/\u2022|\u25cf|\u25aa|\u25cb/g, "-") // • bullets
    .replace(/\u2013|\u2014/g, "-") // – — dashes
    .replace(/\u00b7|\u2027/g, "·".charCodeAt(0) <= 0xff ? "·" : "-") // middle dot (keep, in WinAnsi)
    .replace(/\u2026/g, "...") // …
    .replace(/\u2018|\u2019|\u201a|\u2032/g, "'") // ' ' ‚ ′
    .replace(/\u201c|\u201d|\u201e|\u2033/g, '"') // " " „ ″
    .replace(/\u00a0/g, " ") // nbsp
    .replace(/\u2713|\u2714/g, "v") // ✓ ✔
    .replace(/\u2717|\u2718/g, "x") // ✗ ✘
    .replace(/\u2605|\u2606/g, "*") // ★ ☆
    .replace(/[\u2010\u2011\u2012\u2015]/g, "-")
    .replace(/[^\x00-\xff]/g, "?"); // last resort: anything still outside WinAnsi
}

export async function generateRoadmapPdf(input: Input): Promise<Uint8Array> {
  const r = (input.roadmap ?? {}) as AnyRoadmap;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 50;
  const MAX_W = PAGE_W - MARGIN * 2;
  const GOLD: [number, number, number] = [0.83, 0.66, 0.3];

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (need: number) => {
    if (y - need < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const wrap = (text: string, size: number, f = font): string[] => {
    const safe = toWinAnsi(text);
    const words = safe.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > MAX_W) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const drawText = (
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: [number, number, number];
      gap?: number;
      indent?: number;
    } = {},
  ) => {
    const size = opts.size ?? 11;
    const f = opts.bold ? bold : opts.italic ? italic : font;
    const color = opts.color ?? [0.1, 0.1, 0.1];
    const lines = wrap(text, size, f);
    const x = MARGIN + (opts.indent ?? 0);
    for (const line of lines) {
      ensureSpace(size + 4);
      page.drawText(line, {
        x,
        y: y - size,
        size,
        font: f,
        color: rgb(color[0], color[1], color[2]),
      });
      y -= size + 4;
    }
    if (opts.gap) y -= opts.gap;
  };

  const drawDivider = () => {
    ensureSpace(8);
    page.drawLine({
      start: { x: MARGIN, y: y - 2 },
      end: { x: PAGE_W - MARGIN, y: y - 2 },
      thickness: 0.6,
      color: rgb(GOLD[0], GOLD[1], GOLD[2]),
      opacity: 0.5,
    });
    y -= 10;
  };

  const sectionTitle = (label: string) => {
    drawText(label, { size: 14, bold: true, color: [0.12, 0.12, 0.12], gap: 2 });
    drawDivider();
  };

  // ===== Premium cover header =====
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 8,
    width: PAGE_W,
    height: 8,
    color: rgb(GOLD[0], GOLD[1], GOLD[2]),
  });
  y = PAGE_H - MARGIN - 4;
  drawText("VISACLARITY", { size: 9, bold: true, color: [0.4, 0.32, 0.1], gap: 2 });
  drawText("Premium Visa Roadmap", { size: 22, bold: true, gap: 4 });
  drawText(`${input.nationality} -> ${input.destination}  ·  ${input.purpose}`, {
    size: 12,
    color: [0.35, 0.35, 0.35],
    gap: 6,
  });
  drawText(
    `Generated ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })} — for your personal use.`,
    { size: 9, italic: true, color: [0.5, 0.5, 0.5], gap: 10 },
  );
  drawDivider();

  // ===== Overview =====
  const overview = [
    ["Visa Type", r.visaType],
    ["Processing", r.estimatedProcessingTime],
    ["Est. Total Cost", r.estimatedTotalCost],
    ["Difficulty", r.difficulty],
  ].filter(([, v]) => v) as Array<[string, string]>;

  if (overview.length) {
    sectionTitle("Overview");
    for (const [label, value] of overview) {
      drawText(`${label}: ${value}`, { size: 11 });
    }
    y -= 6;
  }

  if (r.summary) {
    sectionTitle("Summary");
    drawText(r.summary, { gap: 8 });
  }

  // ===== Pre-flight checklist (premium) =====
  if (r.documents?.length) {
    sectionTitle("Pre-flight checklist");
    drawText(
      "Tick each item as you collect or complete it. Critical items must be ready before booking your appointment.",
      { size: 10, italic: true, color: [0.4, 0.4, 0.4], gap: 6 },
    );
    for (const d of r.documents) {
      ensureSpace(16);
      // checkbox
      page.drawRectangle({
        x: MARGIN,
        y: y - 11,
        width: 10,
        height: 10,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 0.8,
        color: rgb(1, 1, 1),
      });
      const label = `${d.name ?? ""}${d.critical ? "   [CRITICAL]" : ""}`;
      drawText(label, {
        bold: true,
        color: d.critical ? [0.65, 0.15, 0.15] : [0.12, 0.12, 0.12],
        indent: 18,
      });
      if (d.details) {
        drawText(d.details, {
          size: 10,
          color: [0.35, 0.35, 0.35],
          indent: 18,
        });
      }
      y -= 4;
    }
    y -= 4;
  }

  // ===== Step-by-step =====
  if (r.steps?.length) {
    sectionTitle("Step-by-step roadmap");
    for (const s of r.steps) {
      const order = String(s.order ?? "").padStart(2, "0");
      drawText(`${order}. ${s.title ?? ""}${s.timeframe ? `   (${s.timeframe})` : ""}`, {
        size: 12,
        bold: true,
        color: GOLD,
        gap: 2,
      });
      if (s.description) drawText(s.description, { indent: 4 });
      if (s.actionItems?.length) {
        for (const a of s.actionItems) drawText(`-  ${a}`, { indent: 12 });
      }
      y -= 6;
    }
  }

  if (r.financialRequirements?.length) {
    sectionTitle("Financial requirements");
    for (const f of r.financialRequirements) {
      drawText(`-  ${f.item ?? ""}: ${f.amount ?? ""}${f.note ? `  — ${f.note}` : ""}`);
    }
    y -= 4;
  }

  if (r.commonRejectionReasons?.length) {
    sectionTitle("Common rejection reasons");
    for (const reason of r.commonRejectionReasons) drawText(`-  ${reason}`);
    y -= 4;
  }

  if (r.proTips?.length) {
    sectionTitle("Pro tips");
    for (const tip of r.proTips) drawText(`-  ${tip}`);
    y -= 4;
  }

  if (r.postArrival?.length) {
    sectionTitle("After arrival");
    for (const t of r.postArrival) drawText(`-  ${t}`);
    y -= 4;
  }

  if (r.sources?.length) {
    sectionTitle("Verified sources");
    for (const src of r.sources) {
      drawText(`-  ${src.title ?? ""}`, { size: 10, bold: true });
      if (src.url) drawText(src.url, { size: 9, color: [0.3, 0.3, 0.6], indent: 8 });
    }
  }

  // Footer
  ensureSpace(20);
  page.drawText(toWinAnsi("VisaClarity Premium · visaclarity.app"), {
    x: MARGIN,
    y: MARGIN - 10,
    size: 9,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });

  return pdf.save();
}

export async function generateRoadmapDocx(input: Input): Promise<Uint8Array> {
  const r = (input.roadmap ?? {}) as AnyRoadmap;
  const children: Paragraph[] = [];

  // Premium cover
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: "VisaClarity — Premium Visa Roadmap", bold: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${input.nationality} → ${input.destination} · ${input.purpose}`,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })} — for your personal use.`,
          italics: true,
          color: "888888",
          size: 18,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  );

  const overview: Array<[string, string | undefined]> = [
    ["Visa Type", r.visaType],
    ["Processing", r.estimatedProcessingTime],
    ["Est. Total Cost", r.estimatedTotalCost],
    ["Difficulty", r.difficulty],
  ];
  if (overview.some(([, v]) => v)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Overview" }));
    for (const [label, value] of overview) {
      if (!value) continue;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)],
        }),
      );
    }
  }

  if (r.summary) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Summary" }),
      new Paragraph(r.summary),
    );
  }

  // Premium checklist with checkbox glyphs
  if (r.documents?.length) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Pre-flight checklist" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Tick each item as you collect or complete it. Critical items must be ready before booking your appointment.",
            italics: true,
            color: "666666",
          }),
        ],
      }),
    );
    for (const d of r.documents) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "☐  " }),
            new TextRun({ text: d.name ?? "", bold: true }),
            ...(d.critical
              ? [new TextRun({ text: "   [CRITICAL]", bold: true, color: "B22222" })]
              : []),
          ],
        }),
      );
      if (d.details) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `   ${d.details}`, color: "555555" })],
          }),
        );
      }
    }
  }

  if (r.steps?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Step-by-step roadmap" }));
    for (const s of r.steps) {
      const order = String(s.order ?? "").padStart(2, "0");
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({ text: `${order}. ${s.title ?? ""}`, bold: true }),
            ...(s.timeframe ? [new TextRun({ text: `  (${s.timeframe})`, italics: true })] : []),
          ],
        }),
      );
      if (s.description) children.push(new Paragraph(s.description));
      if (s.actionItems?.length) {
        for (const a of s.actionItems) {
          children.push(new Paragraph({ text: a, bullet: { level: 0 } }));
        }
      }
    }
  }

  if (r.financialRequirements?.length) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Financial requirements" }),
    );
    for (const f of r.financialRequirements) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${f.item ?? ""}: `, bold: true }),
            new TextRun(f.amount ?? ""),
            ...(f.note ? [new TextRun({ text: ` — ${f.note}`, italics: true })] : []),
          ],
        }),
      );
    }
  }

  if (r.commonRejectionReasons?.length) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Common rejection reasons" }),
    );
    for (const reason of r.commonRejectionReasons) {
      children.push(new Paragraph({ text: reason, bullet: { level: 0 } }));
    }
  }

  if (r.proTips?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Pro tips" }));
    for (const tip of r.proTips) {
      children.push(new Paragraph({ text: tip, bullet: { level: 0 } }));
    }
  }

  if (r.postArrival?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "After arrival" }));
    for (const t of r.postArrival) {
      children.push(new Paragraph({ text: t, bullet: { level: 0 } }));
    }
  }

  if (r.sources?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Verified sources" }));
    for (const src of r.sources) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: src.title ?? "", bold: true }),
            ...(src.url ? [new TextRun({ text: `  ${src.url}`, color: "3030A0" })] : []),
          ],
        }),
      );
    }
  }

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: "VisaClarity Premium · visaclarity.app",
          italics: true,
          color: "888888",
          size: 16,
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}
