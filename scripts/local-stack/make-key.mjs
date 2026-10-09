// Prints a long-lived HS256 JWT for the local stack only (role: anon | service_role).
import crypto from "node:crypto";

const role = process.argv[2];
if (!["anon", "service_role"].includes(role)) throw new Error("role must be anon or service_role");
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is required");

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const header = b64({ alg: "HS256", typ: "JWT" });
const now = Math.floor(Date.now() / 1000);
const payload = b64({ iss: "lvt-local", role, iat: now, exp: now + 60 * 60 * 24 * 365 * 5 });
const sig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
process.stdout.write(`${header}.${payload}.${sig}`);
