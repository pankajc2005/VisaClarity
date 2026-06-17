export async function verifyUrls(urls: string[]): Promise<{ alive: Set<string>; dead: Set<string> }> {
  // Deduplicate and filter out empty strings
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  
  const results = await Promise.all(
    uniqueUrls.map(async (url) => {
      const isAlive = await checkUrl(url);
      return { url, isAlive };
    })
  );
  
  const alive = new Set<string>();
  const dead = new Set<string>();
  
  for (const { url, isAlive } of results) {
    if (isAlive) {
      alive.add(url);
    } else {
      dead.add(url);
    }
  }
  
  return { alive, dead };
}

/**
 * Verifies if a given URL is alive.
 * First tries a HEAD request, and falls back to a GET request if the HEAD request
 * returns a status indicating it's not supported/allowed (e.g. 405, 403, 501) or if it fails.
 */
async function checkUrl(url: string, timeoutMs = 5000): Promise<boolean> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  
  // 1. Try HEAD request first
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
      },
    });
    clearTimeout(id);
    
    // Status in 2xx or 3xx range is successful / redirected, so it's alive
    if (response.status >= 200 && response.status < 400) {
      return true;
    }
    
    // If we got a 404 or 410, it's definitely dead
    if (response.status === 404 || response.status === 410) {
      return false;
    }
    
    // If it's another client error or server error (e.g., 405, 403, 501, 500), fall back to GET
  } catch (err) {
    // If HEAD failed with a network error or timeout, we will try GET as fallback
  }

  // 2. Fallback to GET request
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    // We use a GET request to bypass some servers blocking HEAD.
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
      },
    });
    clearTimeout(id);
    
    // Status 2xx/3xx or 403/401 is considered alive (needs auth but exists)
    // 404/410 is dead.
    return (
      (response.status >= 200 && response.status < 400) ||
      response.status === 403 ||
      response.status === 401
    );
  } catch (err) {
    // Both HEAD and GET failed (network error or timeout)
    return false;
  }
}
