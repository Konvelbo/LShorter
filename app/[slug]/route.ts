import { GET as handleRedirectGet, HEAD as handleRedirectHead } from "@/app/r/[slug]/route";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return handleRedirectGet(req, context);
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return handleRedirectHead(req, context);
}
