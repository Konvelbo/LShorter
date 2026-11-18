import {
  isReservedOriginCookie,
  getMergedUpstreamCookies,
  rewriteSetCookiesForClient,
} from "@/lib/pathlock-proxy";

describe("PathLock Cookie & Security Hardening", () => {
  test("Reserved origin cookies detection", () => {
    expect(isReservedOriginCookie("authjs.session-token")).toBe(true);
    expect(isReservedOriginCookie("__Secure-authjs.session-token")).toBe(true);
    expect(isReservedOriginCookie("__Host-authjs.csrf-token")).toBe(true);
    expect(isReservedOriginCookie("lsh_onboarding_completed")).toBe(true);
    expect(isReservedOriginCookie("theme")).toBe(true);
    expect(isReservedOriginCookie("PHPSESSID")).toBe(false);
    expect(isReservedOriginCookie("__Secure-PHPSESSID")).toBe(false);
    expect(isReservedOriginCookie("cart_id")).toBe(false);
    expect(isReservedOriginCookie("session")).toBe(false);
  });

  test("Outbound cookie filtering: never forward LShorter auth cookies to upstream", () => {
    const testIncomingHeader =
      "__Secure-authjs.session-token=secret_jwt; authjs.csrf-token=csrf123; lsh_onboarding_completed=true; PHPSESSID=coolors_session_123; custom_pref=dark";
    const merged = getMergedUpstreamCookies(testIncomingHeader);

    expect(merged.includes("secret_jwt")).toBe(false);
    expect(merged.includes("authjs")).toBe(false);
    expect(merged.includes("lsh_onboarding_completed")).toBe(false);
    expect(merged.includes("PHPSESSID=coolors_session_123")).toBe(true);
    expect(merged.includes("__Secure-PHPSESSID=coolors_session_123")).toBe(true);
    expect(merged.includes("custom_pref=dark")).toBe(true);
  });

  test("Inbound cookie rewriting (HTTPS): scoped Path and origin protection", () => {
    const rawUpstreamCookies = [
      "__Secure-PHPSESSID=sess_abc; Path=/; Domain=coolors.co; Secure; HttpOnly; SameSite=Strict",
      "authjs.session-token=malicious_overwrite; Path=/",
      "lsh_onboarding_completed=false; Path=/",
      "tracking_id=trk_999; Path=/; SameSite=None",
    ];

    const reqUrlHttps = new URL("https://lsho.cc/r/arknjj/proxy");
    const clientCookiesHttps = rewriteSetCookiesForClient(rawUpstreamCookies, "arknjj", reqUrlHttps);

    expect(clientCookiesHttps.length).toBe(2);
    expect(clientCookiesHttps[0]).toContain("Path=/r/arknjj/proxy");
    expect(clientCookiesHttps[0]).not.toContain("Domain=coolors.co");
    expect(clientCookiesHttps[0]).toContain("SameSite=Lax");
    expect(clientCookiesHttps[0]).toContain("Secure");
    expect(clientCookiesHttps[0]).toContain("HttpOnly");
    expect(clientCookiesHttps[1]).toContain("SameSite=None");
  });

  test("Inbound cookie rewriting (HTTP dev mode)", () => {
    const rawUpstreamCookies = [
      "__Secure-PHPSESSID=sess_abc; Path=/; Domain=coolors.co; Secure; HttpOnly; SameSite=Strict",
      "authjs.session-token=malicious_overwrite; Path=/",
      "lsh_onboarding_completed=false; Path=/",
      "tracking_id=trk_999; Path=/; SameSite=None",
    ];

    const reqUrlHttp = new URL("http://localhost:3000/r/arknjj/proxy");
    const clientCookiesHttp = rewriteSetCookiesForClient(rawUpstreamCookies, "arknjj", reqUrlHttp);

    expect(clientCookiesHttp.length).toBe(2);
    expect(clientCookiesHttp[0]).not.toContain("Secure");
    expect(clientCookiesHttp[0].startsWith("__Secure-")).toBe(false);
    expect(clientCookiesHttp[0].startsWith("PHPSESSID=sess_abc")).toBe(true);
    expect(clientCookiesHttp[1]).toContain("SameSite=Lax");
  });
});
