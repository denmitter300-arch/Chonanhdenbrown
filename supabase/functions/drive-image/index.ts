const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{15,}$/.test(id)) {
    return new Response("Invalid Google Drive file ID", { status: 400, headers: cors });
  }

  try {
    const upstream = await fetch(
      "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w2400",
      { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 DENBROWN-Photo-Selection" } },
    );
    const type = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !type.toLowerCase().startsWith("image/")) {
      return new Response("Google Drive không trả về dữ liệu ảnh. Kiểm tra quyền chia sẻ công khai của file.", {
        status: 502,
        headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const headers = new Headers(cors);
    headers.set("Content-Type", type);
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("Content-Disposition", "inline");
    return new Response(upstream.body, { status: 200, headers });
  } catch (_error) {
    return new Response("Không thể lấy ảnh từ Google Drive.", {
      status: 502,
      headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});
