// Headless Chromium PDF pipeline. Lazily imports playwright (same pattern
// as crawler/browserStrategy.ts) so environments that never export a PDF
// don't pay the browser-binary cost.

const PAGE_WIDTH_PX = 816; // 8.5in @ 96dpi
const PAGE_HEIGHT_PX = 1056; // 11in @ 96dpi

export class PdfRenderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

export interface PdfRenderResult {
  buffer: Buffer;
  /** Estimated page count: content height / one Letter page's height, rounded up. */
  pageCount: number;
  contentHeightPx: number;
}

/**
 * Renders a full standalone HTML document (from templateRenderer.ts) to a
 * PDF buffer via headless Chromium, and estimates page count by measuring
 * rendered content height against a single Letter page's pixel height —
 * this feeds both the download and the ATS "one-page overflow" check.
 */
export async function renderHtmlToPdf(html: string): Promise<PdfRenderResult> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    throw new PdfRenderError(
      "Playwright is not installed. Run `npx playwright install --with-deps chromium`.",
      err,
    );
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX } });
    await page.setContent(html, { waitUntil: "networkidle" });

    const contentHeightPx = await page.evaluate(() => document.body.scrollHeight);

    const buffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    const pageCount = Math.max(1, Math.ceil(contentHeightPx / PAGE_HEIGHT_PX));

    return { buffer, pageCount, contentHeightPx };
  } catch (err) {
    if (err instanceof PdfRenderError) throw err;
    throw new PdfRenderError("Failed to render PDF via headless Chromium", err);
  } finally {
    await browser.close();
  }
}
