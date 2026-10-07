export interface ParsedUserAgent {
  device: "mobile" | "tablet" | "desktop";
  os: "ios" | "android" | "windows" | "macos" | "linux" | "other";
  browser: "chrome" | "safari" | "firefox" | "edge" | "opera" | "samsung" | "brave" | "other";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function parseUserAgent(userAgentRaw: string): ParsedUserAgent {
  const userAgent = (userAgentRaw || "").toLowerCase();

  const isTablet =
    userAgent.includes("ipad") ||
    userAgent.includes("tablet") ||
    (userAgent.includes("android") && !userAgent.includes("mobi"));

  const isMobile =
    !isTablet &&
    (userAgent.includes("mobile") ||
      userAgent.includes("iphone") ||
      userAgent.includes("ipod") ||
      userAgent.includes("android") ||
      userAgent.includes("webos") ||
      userAgent.includes("blackberry") ||
      userAgent.includes("opera mini"));

  const isDesktop = !isMobile && !isTablet;
  const device: "mobile" | "tablet" | "desktop" = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";

  // Operating system detection
  let os: ParsedUserAgent["os"] = "other";
  if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) {
    os = "ios";
  } else if (userAgent.includes("android")) {
    os = "android";
  } else if (userAgent.includes("windows") || userAgent.includes("win32") || userAgent.includes("win64")) {
    os = "windows";
  } else if (userAgent.includes("mac os") || userAgent.includes("macintosh")) {
    os = "macos";
  } else if (userAgent.includes("linux") || userAgent.includes("x11")) {
    os = "linux";
  }

  // Browser detection
  let browser: ParsedUserAgent["browser"] = "other";
  if (userAgent.includes("edg/") || userAgent.includes("edge/")) {
    browser = "edge";
  } else if (userAgent.includes("opr/") || userAgent.includes("opera")) {
    browser = "opera";
  } else if (userAgent.includes("brave")) {
    browser = "brave";
  } else if (userAgent.includes("samsungbrowser")) {
    browser = "samsung";
  } else if (userAgent.includes("firefox") || userAgent.includes("fxios")) {
    browser = "firefox";
  } else if (userAgent.includes("chrome") || userAgent.includes("crios")) {
    browser = "chrome";
  } else if (userAgent.includes("safari")) {
    browser = "safari";
  }

  return {
    device,
    os,
    browser,
    isMobile,
    isTablet,
    isDesktop,
  };
}
