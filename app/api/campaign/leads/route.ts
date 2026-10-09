import { NextRequest, NextResponse } from "next/server";
import { GET as campaignGET, POST as campaignPOST } from "../route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return campaignGET(req);
}

export async function POST(req: NextRequest) {
  return campaignPOST(req);
}
