// AfriLaunch AI — Image generation via Pollinations.ai
// Free, no API key, works from Vercel serverless.
// Replaces Z.AI SDK which uses an internal API unreachable from Vercel.
//
// URL format: https://image.pollinations.ai/prompt/{encoded_prompt}?width={w}&height={h}&nologo=true&model=flux
// Returns: JPEG image data

export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: string; // 'flux' | 'turbo' | 'flux-realism' | etc.
}

export async function generateImage(opts: GenerateImageOptions): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  const { prompt, width = 1024, height = 1024, model = 'flux' } = opts;

  // Build Pollinations URL
  const encodedPrompt = encodeURIComponent(prompt.slice(0, 500));
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&model=${model}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(60000), // 60s max per image
    });

    if (!res.ok) {
      return { ok: false, error: `Pollinations HTTP ${res.status}` };
    }

    const buffer = await res.arrayBuffer();
    if (!buffer || buffer.byteLength < 1000) {
      return { ok: false, error: 'Pollinations: image vide' };
    }

    // Convert to base64 data URL (JPEG format)
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return { ok: true, dataUrl };
  } catch (err) {
    return { ok: false, error: `Pollinations: ${(err as Error).message}` };
  }
}
