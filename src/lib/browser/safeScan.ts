import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import type { Browser, BrowserContext } from "playwright";
import type { ScanUrlOptions, UrlScanResult } from "@/lib/browser/types";

const DEFAULT_TIMEOUT_MS = 10000;
const MIN_TIMEOUT_MS = 3000;
const MAX_TIMEOUT_MS = 30000;
const SCREENSHOTS_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "screenshots",
);
const DEFAULT_BASE_URL = "http://localhost:3000";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function getTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.BROWSER_TIMEOUT ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "");

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    normalized === "0.0.0.0"
  ) {
    return true;
  }

  if (
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    normalized.startsWith("169.254.")
  ) {
    return true;
  }

  const match = /^172\.(\d{1,3})\./.exec(normalized);

  if (match !== null) {
    const secondOctet = Number.parseInt(match[1] ?? "", 10);

    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

function resolveTargetUrl(rawUrl: string, baseUrl?: string): URL | null {
  const trimmed = rawUrl.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    if (trimmed.startsWith("/")) {
      if (!trimmed.startsWith("/demo/")) {
        return null;
      }

      const base = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE_URL;
      const relativeTarget = new URL(trimmed, base);

      if (
        relativeTarget.protocol !== "http:" &&
        relativeTarget.protocol !== "https:"
      ) {
        return null;
      }

      return relativeTarget;
    }

    const target = new URL(trimmed);

    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return null;
    }

    return target;
  } catch {
    return null;
  }
}

function safeFileId(analysisId?: string): string {
  const sanitized = (analysisId ?? "").replace(/[^a-zA-Z0-9_-]/g, "");

  return sanitized.length > 0 ? sanitized : randomUUID();
}

function errorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Unknown browser error";
  const firstLine = raw.split(/\r?\n/)[0]?.trim() ?? "Unknown browser error";

  return firstLine.slice(0, 300);
}

function buildErrorResult(
  originalUrl: string,
  error: string,
  domain: string | null = null,
): UrlScanResult {
  return {
    originalUrl,
    finalUrl: null,
    domain,
    pageTitle: null,
    screenshotPath: null,
    hasPasswordField: false,
    formsCount: 0,
    status: "ERROR",
    error,
  };
}

export async function scanUrl(
  url: string,
  demoMode: boolean,
  options: ScanUrlOptions = {},
): Promise<UrlScanResult> {
  const target = resolveTargetUrl(url, options.baseUrl);

  if (target === null) {
    return buildErrorResult(
      url,
      "Invalid or unsupported URL. Only HTTP(S) and /demo/ paths are allowed.",
    );
  }

  const originalUrl = target.toString();
  const originalDomain = target.hostname.toLowerCase().replace(/^www\./, "");
  const isPrivateTarget = isPrivateHostname(target.hostname);
  const isDemoPath = target.pathname.startsWith("/demo/");

  if (isPrivateTarget && !demoMode && !isDemoPath) {
    return buildErrorResult(
      originalUrl,
      "Private network URLs are blocked outside demo mode.",
      originalDomain,
    );
  }

  const timeout = getTimeoutMs();
  const fileId = safeFileId(options.analysisId);
  const screenshotFileName = `${fileId}.png`;
  const screenshotAbsolutePath = path.join(
    SCREENSHOTS_DIRECTORY,
    screenshotFileName,
  );
  const screenshotPublicPath = `/screenshots/${screenshotFileName}`;

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      timeout: Math.max(timeout, 15000),
    });

    context = await browser.newContext({
      acceptDownloads: false,
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 800 },
      userAgent: USER_AGENT,
      locale: "en-US",
    });

    await context.route("**/*", async (route) => {
      try {
        const resourceUrl = new URL(route.request().url());

        if (
          (resourceUrl.protocol === "http:" ||
            resourceUrl.protocol === "https:") &&
          !isPrivateTarget &&
          isPrivateHostname(resourceUrl.hostname)
        ) {
          await route.abort("blockedbyclient");
          return;
        }
      } catch {
        await route.abort("blockedbyclient");
        return;
      }

      await route.continue();
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);
    page.on("dialog", (dialog) => {
      void dialog.dismiss().catch(() => undefined);
    });

    await page.goto(originalUrl, {
      waitUntil: "domcontentloaded",
      timeout,
    });

    await page
      .waitForLoadState("networkidle", {
        timeout: Math.min(timeout, 3000),
      })
      .catch(() => undefined);

    const finalUrl = page.url();
    const finalDomain = new URL(finalUrl).hostname
      .toLowerCase()
      .replace(/^www\./, "");
    const rawTitle = await page.title();
    const pageTitle = rawTitle.trim().slice(0, 300) || null;
    const hasPasswordField =
      (await page.locator('input[type="password"]').count()) > 0;
    const formsCount = await page.locator("form").count();

    let screenshotPath: string | null = null;
    let screenshotError: string | null = null;

    try {
      await mkdir(SCREENSHOTS_DIRECTORY, { recursive: true });
      await page.screenshot({
        path: screenshotAbsolutePath,
        fullPage: false,
        timeout,
      });
      screenshotPath = screenshotPublicPath;
    } catch (error) {
      screenshotError = `Screenshot capture failed: ${errorMessage(error)}`;
    }

    return {
      originalUrl,
      finalUrl,
      domain: finalDomain.length > 0 ? finalDomain : originalDomain,
      pageTitle,
      screenshotPath,
      hasPasswordField,
      formsCount,
      status: "SUCCESS",
      error: screenshotError,
    };
  } catch (error) {
    return buildErrorResult(
      originalUrl,
      `Browser scan failed: ${errorMessage(error)}`,
      originalDomain,
    );
  } finally {
    if (context !== null) {
      await context.close().catch(() => undefined);
    }

    if (browser !== null) {
      await browser.close().catch(() => undefined);
    }
  }
}
