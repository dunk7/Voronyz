/**
 * Proxies the V4 top STL for Tinkercad "Import from URL".
 * Tinkercad's client/server checks are picky; hosting on voronyz.com with a
 * simple path avoids odd failures seen on other URL shapes.
 *
 * Upstream: jsDelivr (same file committed in this repo on main).
 */
const UPSTREAM =
  "https://cdn.jsdelivr.net/gh/dunk7/Voronyz@main/web/public/downloads/v4/v4.04t.stl";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "*",
};

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const method = request.method === "HEAD" ? "HEAD" : "GET";
  const upstream = await fetch(UPSTREAM, {
    method,
    headers: { "user-agent": "voronyz-tinkercad-proxy/1.0" },
  });

  if (!upstream.ok) {
    return new Response("Failed to fetch model file", {
      status: 502,
      headers: CORS,
    });
  }

  const headers = new Headers(CORS);
  headers.set("content-type", "model/stl");
  headers.set("content-disposition", 'attachment; filename="v4.04t.stl"');
  const len = upstream.headers.get("content-length");
  if (len) headers.set("content-length", len);
  headers.set("cache-control", "public, max-age=300");

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  return new Response(upstream.body, { status: 200, headers });
};

// Path must end in .stl for Tinkercad's URL file-type check.
export const config = { path: "/tinkercad/v4.stl" };
