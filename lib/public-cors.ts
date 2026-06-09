import { NextResponse } from "next/server";

export function withPublicCors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export function publicCorsPreflight(): NextResponse {
  return withPublicCors(new NextResponse(null, { status: 204 }));
}
