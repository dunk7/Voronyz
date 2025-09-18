// Client-side only checkout API for static export
export async function POST() {
  return new Response(JSON.stringify({
    id: `mock-session-${Date.now()}`,
    url: `/checkout/success?session_id=mock-session-${Date.now()}`
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
