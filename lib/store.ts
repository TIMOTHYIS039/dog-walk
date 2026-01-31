export type WalkStatus = "active" | "completed";

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface PeePooEvent {
  id: string;
  walkId: string;
  type: "pee" | "poo";
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Walk {
  id: string;
  code: string;
  status: WalkStatus;
  startedAt: number;
  endedAt: number | null;
  route: RoutePoint[];
  events: PeePooEvent[];
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

const walks = new Map<string, Walk>();

export function createWalk(): Walk {
  let code: string;
  do {
    code = generateCode();
  } while (walks.has(code));

  const id = crypto.randomUUID();
  const walk: Walk = {
    id,
    code,
    status: "active",
    startedAt: Date.now(),
    endedAt: null,
    route: [],
    events: [],
  };
  walks.set(code, walk);
  return walk;
}

export function getWalk(code: string): Walk | undefined {
  return walks.get(code.toUpperCase());
}

export function appendRoutePoint(code: string, point: RoutePoint): Walk | undefined {
  const walk = walks.get(code.toUpperCase());
  if (!walk || walk.status !== "active") return undefined;
  walk.route.push(point);
  return walk;
}

export function addPeePooEvent(code: string, event: Omit<PeePooEvent, "id" | "walkId">): Walk | undefined {
  const walk = walks.get(code.toUpperCase());
  if (!walk || walk.status !== "active") return undefined;
  const fullEvent: PeePooEvent = {
    ...event,
    id: crypto.randomUUID(),
    walkId: walk.id,
  };
  walk.events.push(fullEvent);
  return walk;
}

export function endWalk(code: string): Walk | undefined {
  const walk = walks.get(code.toUpperCase());
  if (!walk || walk.status !== "active") return undefined;
  walk.status = "completed";
  walk.endedAt = Date.now();
  return walk;
}
