// Client-side only auth API for static export
export async function GET() {
  return new Response(JSON.stringify({
    user: {
      id: "demo-user",
      email: "demo@example.com",
      name: "Demo User"
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}


