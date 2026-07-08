export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Fail-safe for production deployments where OAuth env vars are not set yet.
  if (!oauthPortalUrl || !appId) {
    return "/404";
  }

  let url: URL;
  try {
    url = new URL("/app-auth", oauthPortalUrl);
  } catch {
    return "/404";
  }

  url.searchParams.set("appId", String(appId));
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
