import { GET as handleRedirectGet } from "@/app/r/[slug]/route";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return handleRedirectGet(req, context);
}
