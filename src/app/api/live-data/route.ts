import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { cloneLiveFromSeed, LIVE_STORAGE_VERSION } from "@/lib/live-data";
import { loadMockData } from "@/lib/mock-data-loader";
import type { LiveDataBundle } from "@/types/mock-data";

interface LiveStorageEnvelope {
  version: number;
  payload: LiveDataBundle;
}

const STORE_DIR = path.join(process.cwd(), ".ankuaru");
const STORE_FILE = path.join(STORE_DIR, "live-data.json");

function fallbackEnvelope(): LiveStorageEnvelope {
  const seed = loadMockData();
  return {
    version: LIVE_STORAGE_VERSION,
    payload: cloneLiveFromSeed(seed),
  };
}

async function ensureStore(): Promise<LiveStorageEnvelope> {
  await mkdir(STORE_DIR, { recursive: true });
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as LiveStorageEnvelope;
    if (parsed.version === LIVE_STORAGE_VERSION && parsed.payload) {
      return parsed;
    }
  } catch {
    // fall through to initialize
  }
  const initial = fallbackEnvelope();
  await writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
  return initial;
}

export async function GET() {
  const envelope = await ensureStore();
  return Response.json(envelope, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<LiveStorageEnvelope> | null;
  if (!body?.payload) {
    return Response.json({ ok: false, message: "Missing payload." }, { status: 400 });
  }
  const next: LiveStorageEnvelope = {
    version: LIVE_STORAGE_VERSION,
    payload: body.payload,
  };
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(next, null, 2), "utf8");
  return Response.json({ ok: true, version: next.version });
}
