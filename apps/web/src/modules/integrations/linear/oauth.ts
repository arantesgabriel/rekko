import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { LinearProviderError } from "./gateway";

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
  scope: z.union([z.string(), z.array(z.string())]),
  token_type: z.literal("Bearer"),
});

export type LinearTokens = {
  accessToken: string;
  expiresAt: Date;
  refreshToken: string;
  scopes: string[];
};

export function createOAuthProof() {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { challenge, state, verifier };
}

export function buildAuthorizationUrl(input: {
  challenge: string;
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://linear.app/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: input.clientId,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
    prompt: "consent",
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: "read",
    state: input.state,
  }).toString();
  return url;
}

export async function exchangeAuthorizationCode(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  request?: typeof fetch;
  verifier: string;
}) {
  return requestTokens(
    {
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      code_verifier: input.verifier,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    },
    input.request,
  );
}

export async function refreshAccessToken(input: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  request?: typeof fetch;
}) {
  return requestTokens(
    {
      client_id: input.clientId,
      client_secret: input.clientSecret,
      grant_type: "refresh_token",
      refresh_token: input.refreshToken,
    },
    input.request,
  );
}

async function requestTokens(
  parameters: Record<string, string>,
  request: typeof fetch = fetch,
): Promise<LinearTokens> {
  let response: Response;
  try {
    response = await request("https://api.linear.app/oauth/token", {
      body: new URLSearchParams(parameters),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });
  } catch {
    throw new LinearProviderError("NETWORK_ERROR");
  }
  if (response.status === 401 || response.status === 400)
    throw new LinearProviderError("AUTH_REVOKED");
  if (!response.ok) throw new LinearProviderError("GRAPHQL_ERROR");
  const parsed = tokenSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new LinearProviderError("INVALID_PAYLOAD");
  return {
    accessToken: parsed.data.access_token,
    expiresAt: new Date(Date.now() + parsed.data.expires_in * 1000),
    refreshToken: parsed.data.refresh_token,
    scopes: Array.isArray(parsed.data.scope)
      ? parsed.data.scope
      : parsed.data.scope.split(/[ ,]+/).filter(Boolean),
  };
}
