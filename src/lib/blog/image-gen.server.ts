/**
 * Free image generation, no card required.
 *
 * Provider: Pollinations.ai (FLUX, no key, public endpoint)
 */

const NEGATIVE = [
  "no text",
  "no watermark",
  "no logos",
  "no captions",
  "no passport-holding clichés",
  "no generic stock-photo faces",
  "no flags",
  "no faces shown clearly",
].join(", ");

export interface GeneratedImage {
  bytes: Uint8Array;
  provider: string;
  promptUsed: string;
}

async function viaPollinations(prompt: string): Promise<GeneratedImage | null> {
  const finalPrompt = `${prompt}. Editorial photograph, natural light, documentary, magazine quality. ${NEGATIVE}.`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1536&height=1024&model=flux&nologo=true&enhance=true&safe=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000); // 15s timeout cap

  try {
    const res = await fetch(url, {
      headers: { Accept: "image/png" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 2000) return null;
    return {
      bytes: buf,
      provider: "pollinations-flux",
      promptUsed: finalPrompt,
    };
  } catch (err) {
    clearTimeout(timer);
    console.error("Pollinations image generation failed or timed out:", err);
    return null;
  }
}

export async function generateHeroImage(
  prompt: string,
  _opts?: { preferProvider?: number },
): Promise<GeneratedImage | null> {
  return await viaPollinations(prompt);
}

export default { generateHeroImage };
