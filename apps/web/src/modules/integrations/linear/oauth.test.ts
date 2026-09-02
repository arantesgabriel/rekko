import { describe, expect, it, vi } from "vitest";

import {
  buildAuthorizationUrl,
  createOAuthProof,
  exchangeAuthorizationCode,
  refreshAccessToken,
} from "./oauth";

describe("Linear OAuth", () => {
  it("creates state and an S256 PKCE proof", () => {
    const proof = createOAuthProof();
    expect(proof.state.length).toBeGreaterThan(30);
    expect(proof.verifier.length).toBeGreaterThan(43);
    expect(proof.challenge).not.toBe(proof.verifier);
  });

  it("requests only read scope and binds state, redirect and PKCE", () => {
    const url = buildAuthorizationUrl({
      challenge: "challenge",
      clientId: "client",
      redirectUri: "https://rekko.test/callback",
      state: "state",
    });
    expect(url.searchParams.get("scope")).toBe("read");
    expect(url.searchParams.get("state")).toBe("state");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://rekko.test/callback",
    );
  });

  it("exchanges and refreshes with form encoded server credentials", async () => {
    const request = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => {
        void _url;
        void _init;
        return new Response(
          JSON.stringify({
            access_token: "access",
            expires_in: 3600,
            refresh_token: "refresh-2",
            scope: "read",
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      },
    );
    const exchanged = await exchangeAuthorizationCode({
      clientId: "client",
      clientSecret: "secret",
      code: "code",
      redirectUri: "https://rekko.test/callback",
      request,
      verifier: "verifier",
    });
    await refreshAccessToken({
      clientId: "client",
      clientSecret: "secret",
      refreshToken: exchanged.refreshToken,
      request,
    });
    const firstBody = request.mock.calls[0]?.[1]?.body as URLSearchParams;
    const secondBody = request.mock.calls[1]?.[1]?.body as URLSearchParams;
    expect(firstBody.get("code_verifier")).toBe("verifier");
    expect(secondBody.get("grant_type")).toBe("refresh_token");
    expect(secondBody.get("refresh_token")).toBe("refresh-2");
  });
});
