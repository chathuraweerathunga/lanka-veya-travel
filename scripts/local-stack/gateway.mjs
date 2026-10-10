// Local-only API gateway that imitates the hosted Supabase URL layout:
//   /auth/v1/*    -> Supabase Auth (GoTrue) binary
//   /rest/v1/*    -> PostgREST binary
//   /storage/v1/* -> tiny on-disk emulator (object upload/delete/public read)
// It exists so the app can be exercised end-to-end without Docker.
// Do not deploy this file anywhere.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.GATEWAY_PORT ?? 54321);
const AUTH = `http://127.0.0.1:${process.env.AUTH_PORT ?? 9999}`;
const REST = `http://127.0.0.1:${process.env.REST_PORT ?? 3001}`;
const STORAGE_DIR = process.env.STORAGE_DIR ?? "/tmp/lvt-storage";
const JWT_SECRET = process.env.JWT_SECRET;

function verifyJwt(token) {
  try {
    const [h, p, s] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest("base64url");
    if (expected !== s) return null;
    return JSON.parse(Buffer.from(p, "base64url").toString());
  } catch {
    return null;
  }
}

function proxy(req, res, target, strip) {
  const url = new URL(req.url.slice(strip.length) || "/", target);
  const headers = { ...req.headers, host: url.host };
  const upstream = http.request(url, { method: req.method, headers }, (up) => {
    res.writeHead(up.statusCode ?? 502, up.headers);
    up.pipe(res);
  });
  upstream.on("error", (e) => {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: `gateway: ${e.message}` }));
  });
  req.pipe(upstream);
}

function storage(req, res) {
  const rest = req.url.replace(/^\/storage\/v1/, "").split("?")[0];
  const pub = rest.match(/^\/object\/public\/([^/]+)\/(.+)$/);
  if (pub && req.method === "GET") {
    const file = path.join(STORAGE_DIR, pub[1], decodeURIComponent(pub[2]));
    if (!file.startsWith(STORAGE_DIR) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    const meta = fs.existsSync(file + ".meta") ? JSON.parse(fs.readFileSync(file + ".meta", "utf8")) : {};
    res.writeHead(200, { "content-type": meta.contentType ?? "application/octet-stream" });
    return fs.createReadStream(file).pipe(res);
  }
  const claims = verifyJwt((req.headers.authorization ?? "").replace(/^Bearer /, ""));
  if (!claims || claims.role !== "service_role") {
    res.writeHead(403, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: "local storage emulator only accepts service_role" }));
  }
  const list = rest.match(/^\/object\/list\/([^/]+)$/);
  if (list && req.method === "POST") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const { prefix = "", limit = 100, sortBy } = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      const dir = path.join(STORAGE_DIR, list[1], prefix);
      const out = [];
      if (dir.startsWith(STORAGE_DIR) && fs.existsSync(dir)) {
        for (const name of fs.readdirSync(dir)) {
          if (name.endsWith(".meta")) continue;
          const full = path.join(dir, name);
          const st = fs.statSync(full);
          out.push(
            st.isDirectory()
              ? { name, id: null, created_at: null, updated_at: null, metadata: null }
              : { name, id: crypto.randomUUID(), created_at: st.mtime.toISOString(), updated_at: st.mtime.toISOString(), metadata: { size: st.size } },
          );
        }
      }
      out.sort((a, b) => (sortBy?.order === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(out.slice(0, limit)));
    });
    return;
  }
  const obj = rest.match(/^\/object\/([^/]+)\/(.+)$/);
  if (obj && (req.method === "POST" || req.method === "PUT")) {
    const file = path.join(STORAGE_DIR, obj[1], decodeURIComponent(obj[2]));
    if (!file.startsWith(STORAGE_DIR)) {
      res.writeHead(400);
      return res.end();
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      fs.writeFileSync(file, Buffer.concat(chunks));
      fs.writeFileSync(file + ".meta", JSON.stringify({ contentType: req.headers["content-type"] }));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ Key: `${obj[1]}/${obj[2]}`, Id: crypto.randomUUID() }));
    });
    return;
  }
  const del = rest.match(/^\/object\/([^/]+)$/);
  if (del && req.method === "DELETE") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const { prefixes = [] } = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      for (const p of prefixes) {
        const file = path.join(STORAGE_DIR, del[1], p);
        if (file.startsWith(STORAGE_DIR)) fs.rmSync(file, { force: true });
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end("[]");
    });
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "not emulated" }));
}

http
  .createServer((req, res) => {
    if (req.url.startsWith("/auth/v1")) return proxy(req, res, AUTH, "/auth/v1");
    if (req.url.startsWith("/rest/v1")) return proxy(req, res, REST, "/rest/v1");
    if (req.url.startsWith("/storage/v1")) return storage(req, res);
    res.writeHead(404);
    res.end();
  })
  .listen(PORT, () => console.log(`local supabase gateway on :${PORT}`));
