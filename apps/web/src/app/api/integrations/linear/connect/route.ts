import { NextResponse } from "next/server";
import { parseServerEnv } from "@rekko/shared/env";
import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";
import {
  buildAuthorizationUrl,
  createOAuthProof,
} from "@/modules/integrations/linear/oauth";
import { connectLinear } from "@/modules/integrations/linear/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("workspace");
  if (!slug) return new NextResponse("Invalid workspace", { status: 400 });
  const session = await requireCoreSession(`/w/${slug}/integrations`);
  await requireWorkspace(session.user.id, slug, "linear:manage");

  if (process.env.REKKO_E2E === "true") {
    await connectLinear({
      externalWorkspaceId: `linear-${slug}`,
      externalWorkspaceName: "Linear Test Workspace",
      slug,
      tokens: {
        accessToken: "e2e-access-token",
        expiresAt: new Date(Date.now() + 86_400_000),
        refreshToken: "e2e-refresh-token",
        scopes: ["read"],
      },
      userId: session.user.id,
    });
    return NextResponse.redirect(
      new URL(`/w/${slug}/integrations?linear=connected`, url),
    );
  }

  const env = parseServerEnv(process.env);
  if (!env.LINEAR_CLIENT_ID || !env.LINEAR_REDIRECT_URI)
    return NextResponse.redirect(
      new URL(`/w/${slug}/integrations?linear=not-configured`, url),
    );
  const proof = createOAuthProof();
  const response = NextResponse.redirect(
    buildAuthorizationUrl({
      challenge: proof.challenge,
      clientId: env.LINEAR_CLIENT_ID,
      redirectUri: env.LINEAR_REDIRECT_URI,
      state: proof.state,
    }),
  );
  response.cookies.set(
    "rekko-linear-oauth",
    Buffer.from(
      JSON.stringify({
        createdAt: Date.now(),
        slug,
        state: proof.state,
        verifier: proof.verifier,
      }),
    ).toString("base64url"),
    {
      httpOnly: true,
      maxAge: 600,
      path: "/api/integrations/linear/callback",
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  );
  return response;
}
