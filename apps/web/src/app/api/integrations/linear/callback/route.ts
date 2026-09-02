import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseServerEnv } from "@rekko/shared/env";
import { z } from "zod";
import { requireCoreSession } from "@/modules/auth/session";
import { HttpLinearGateway } from "@/modules/integrations/linear/gateway";
import { exchangeAuthorizationCode } from "@/modules/integrations/linear/oauth";
import { connectLinear } from "@/modules/integrations/linear/service";

const proofSchema = z.object({
  createdAt: z.number(),
  slug: z.string().min(1),
  state: z.string().min(32),
  verifier: z.string().min(43),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const encoded = cookieStore.get("rekko-linear-oauth")?.value;
  cookieStore.delete("rekko-linear-oauth");
  let proof: z.infer<typeof proofSchema> | null = null;
  try {
    proof = proofSchema.parse(
      JSON.parse(Buffer.from(encoded ?? "", "base64url").toString("utf8")),
    );
  } catch {
    return new NextResponse("Invalid OAuth state", { status: 400 });
  }
  if (
    proof.state !== url.searchParams.get("state") ||
    Date.now() - proof.createdAt > 600_000
  )
    return new NextResponse("Invalid OAuth state", { status: 400 });
  const code = url.searchParams.get("code");
  if (!code)
    return NextResponse.redirect(
      new URL(`/w/${proof.slug}/integrations?linear=failed`, url),
    );
  const session = await requireCoreSession(`/w/${proof.slug}/integrations`);
  const env = parseServerEnv(process.env);
  if (
    !env.LINEAR_CLIENT_ID ||
    !env.LINEAR_CLIENT_SECRET ||
    !env.LINEAR_REDIRECT_URI
  )
    return NextResponse.redirect(
      new URL(`/w/${proof.slug}/integrations?linear=not-configured`, url),
    );
  try {
    const tokens = await exchangeAuthorizationCode({
      clientId: env.LINEAR_CLIENT_ID,
      clientSecret: env.LINEAR_CLIENT_SECRET,
      code,
      redirectUri: env.LINEAR_REDIRECT_URI,
      verifier: proof.verifier,
    });
    const organization = await new HttpLinearGateway(
      tokens.accessToken,
    ).getOrganization();
    await connectLinear({
      externalWorkspaceId: organization.id,
      externalWorkspaceName: organization.name,
      slug: proof.slug,
      tokens,
      userId: session.user.id,
    });
    return NextResponse.redirect(
      new URL(`/w/${proof.slug}/integrations?linear=connected`, url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/w/${proof.slug}/integrations?linear=failed`, url),
    );
  }
}
