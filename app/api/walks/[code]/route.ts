import { NextRequest, NextResponse } from "next/server";
import {
  getWalk,
  appendRoutePoint,
  addPeePooEvent,
  endWalk,
} from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const walk = getWalk(code);
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }
  return NextResponse.json(walk);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();

  if (body.routePoint) {
    const { lat, lng, timestamp } = body.routePoint;
    const walk = appendRoutePoint(code, { lat, lng, timestamp });
    if (!walk) {
      return NextResponse.json({ error: "Walk not found or already ended" }, { status: 400 });
    }
    return NextResponse.json(walk);
  }

  if (body.event) {
    const { type, lat, lng, timestamp } = body.event;
    if (type !== "pee" && type !== "poo") {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    const walk = addPeePooEvent(code, { type, lat, lng, timestamp });
    if (!walk) {
      return NextResponse.json({ error: "Walk not found or already ended" }, { status: 400 });
    }
    return NextResponse.json(walk);
  }

  if (body.status === "completed") {
    const walk = endWalk(code);
    if (!walk) {
      return NextResponse.json({ error: "Walk not found or already ended" }, { status: 400 });
    }
    return NextResponse.json(walk);
  }

  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}
