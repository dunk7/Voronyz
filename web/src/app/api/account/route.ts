// Client-side only account API for static export
export async function GET() {
  return new Response(JSON.stringify({
    preferences: {},
    footScanMetadata: {}
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}


