const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

function reply(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return reply("Method not allowed", 405);

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{15,}$/.test(id)) {
    return reply("Invalid Google Drive file ID", 400);
  }

  // Keep the existing website contract: /drive-image?id=FILE_ID
  // Try the thumbnail endpoint first, then the direct download endpoint.
  const sources = [
    "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w3000",
    "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(id),
  ];

  for (const source of sources) {
    try {
      const upstream = await fetch(source, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 DENBROWN-Photo-Selection" },
      });
      const type = upstream.headers.get("content-type") || "";
      if (upstream.ok && type.toLowerCase().startsWith("image/")) {
        const headers = new Headers(cors);
        headers.set("Content-Type", type);
        headers.set("Cache-Control", "public, max-age=1800");
        headers.set("Content-Disposition", "inline");
        const length = upstream.headers.get("content-length");
        if (length) headers.set("Content-Length", length);
        return new Response(upstream.body, { status: 200, headers });
      }
      await upstream.body?.cancel();
    } catch (_error) {
      // Try the next Google Drive endpoint.
    }
  }

  return reply(
    "Google Drive không trả về dữ liệu ảnh. Hãy đặt quyền file thành 'Bất kỳ ai có đường liên kết — Người xem'.",
    502,
  );
});
