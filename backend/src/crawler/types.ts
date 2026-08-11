export interface CrawlResult {
  url: string;
  html: string;
  fetchedWith: "http" | "browser";
  statusCode?: number;
}

export class CrawlError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

/** Basic SSRF guard: block localhost/private ranges and non-http(s) schemes. */
export function assertSafePublicUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new CrawlError("Invalid URL", rawUrl);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new CrawlError("Only http/https URLs are allowed", rawUrl);
  }

  const hostname = url.hostname.toLowerCase();
  const blockedHosts = ["localhost", "0.0.0.0", "::1"];
  const privateIpPattern =
    /^(127\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|169\.254\.)/;

  if (blockedHosts.includes(hostname) || privateIpPattern.test(hostname)) {
    throw new CrawlError("URL resolves to a private/internal address", rawUrl);
  }

  return url;
}
