import { NextResponse } from "next/server";
import { createWalk } from "@/lib/store";

export async function POST() {
  const walk = createWalk();
  return NextResponse.json({ code: walk.code });
}
