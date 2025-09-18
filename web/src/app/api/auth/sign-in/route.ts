// Client-side only auth API for static export
export async function POST() {
  return new Response(JSON.stringify({
    ok: true,
    user: {
      id: "demo-user",
      email: "demo@example.com",
      name: "Demo User"
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}


