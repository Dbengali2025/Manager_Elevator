import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const [localPath, storageKey] = process.argv.slice(2);
if (!localPath || !storageKey) {
  console.error("Usage: node scripts/replace-lesson-resource.mjs <local-file> <storage-key>");
  process.exit(1);
}

const BASE = process.env.NEXT_PUBLIC_INSFORGE_URL;
const KEY = process.env.INSFORGE_API_KEY;
if (!BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_INSFORGE_URL or INSFORGE_API_KEY");
  process.exit(1);
}
const BUCKET = "lesson-resources";
const auth = { Authorization: `Bearer ${KEY}` };
const encodedKey = encodeURIComponent(storageKey);

async function api(method, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { method, ...opts, headers: { ...auth, ...(opts.headers || {}) } });
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res;
}

// 1. Back up existing object
const dlStrategy = await (await api("POST", `/api/storage/buckets/${BUCKET}/objects/${encodedKey}/download-strategy`, {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ expiresIn: 3600 }),
})).json();
const oldRes = await fetch(dlStrategy.url, { headers: dlStrategy.method === "direct" ? auth : {} });
if (!oldRes.ok) throw new Error(`Backup download failed: ${oldRes.status}`);
const oldBytes = Buffer.from(await oldRes.arrayBuffer());
const backupPath = `/tmp/backup-${basename(storageKey)}`;
await writeFile(backupPath, oldBytes);
console.log(`Backed up ${oldBytes.length} bytes -> ${backupPath}`);

// 2. Upload replacement to the same key
const bytes = await readFile(localPath);
const file = new File([bytes], basename(storageKey), { type: "application/pdf" });
const upStrategy = await (await api("POST", `/api/storage/buckets/${BUCKET}/upload-strategy`, {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filename: storageKey, contentType: "application/pdf", size: file.size }),
})).json();

let resultKey;
if (upStrategy.method === "direct") {
  const form = new FormData();
  form.append("file", file);
  const data = await (await api("PUT", `/api/storage/buckets/${BUCKET}/objects/${encodedKey}`, { body: form })).json();
  resultKey = data.key ?? storageKey;
} else if (upStrategy.method === "presigned") {
  if (upStrategy.key && upStrategy.key !== storageKey) {
    throw new Error(`Presigned strategy returned a different key (${upStrategy.key}); aborting to avoid orphan object`);
  }
  const form = new FormData();
  for (const [k, v] of Object.entries(upStrategy.fields ?? {})) form.append(k, v);
  form.append("file", file);
  const upRes = await fetch(upStrategy.uploadUrl, { method: "POST", body: form });
  if (!upRes.ok) throw new Error(`Presigned upload failed: ${upRes.status}`);
  if (upStrategy.confirmRequired && upStrategy.confirmUrl) {
    const confirmed = await (await api("POST", upStrategy.confirmUrl, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size: file.size, contentType: "application/pdf" }),
    })).json();
    resultKey = confirmed.key ?? upStrategy.key;
  } else {
    resultKey = upStrategy.key ?? storageKey;
  }
} else {
  throw new Error(`Unsupported upload method: ${upStrategy.method}`);
}
console.log(`Uploaded ${bytes.length} bytes as ${resultKey}`);

// 3. Verify the object at the key now has the new size
const verifyStrategy = await (await api("POST", `/api/storage/buckets/${BUCKET}/objects/${encodedKey}/download-strategy`, {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ expiresIn: 3600 }),
})).json();
const verifyRes = await fetch(verifyStrategy.url, { headers: verifyStrategy.method === "direct" ? auth : {} });
const verifyBytes = Buffer.from(await verifyRes.arrayBuffer());
console.log(`Verify: object is now ${verifyBytes.length} bytes (expected ${bytes.length}) -> ${verifyBytes.length === bytes.length ? "OK" : "MISMATCH"}`);
if (verifyBytes.length !== bytes.length) process.exit(1);
