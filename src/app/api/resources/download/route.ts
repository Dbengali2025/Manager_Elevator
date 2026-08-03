import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/auth-helpers";
import { insforgeClient } from "@/lib/insforge";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY ?? "";

export async function GET(request: NextRequest) {
  // This route proxies storage using the privileged service key, so it must
  // establish who is asking before it does anything else.
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const storagePath = request.nextUrl.searchParams.get("path");

  if (!storagePath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Only serve paths that are actually registered as lesson resources. Without
  // this the caller could name any object in the bucket and we would fetch it
  // for them with the service key.
  const { data: resources, error: lookupError } = await insforgeClient
    .from("lesson_resources")
    .select<Array<{ file_name: string; storage_path: string }>>(
      token,
      `?storage_path=eq.${encodeURIComponent(storagePath)}&select=file_name,storage_path`
    );

  if (lookupError) {
    return NextResponse.json({ error: "Failed to verify resource" }, { status: 500 });
  }

  const resource = resources?.[0];
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // Get download strategy from Insforge
  const encodedPath = encodeURIComponent(storagePath);
  const strategyRes = await fetch(
    `${INSFORGE_URL}/api/storage/buckets/lesson-resources/objects/${encodedPath}/download-strategy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${INSFORGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );

  if (!strategyRes.ok) {
    return NextResponse.json(
      { error: "Failed to get download URL" },
      { status: 500 }
    );
  }

  const strategy = await strategyRes.json();

  // Fetch the file and stream it back with proper headers for download
  const fileRes = await fetch(strategy.url);
  if (!fileRes.ok) {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }

  const blob = await fileRes.blob();

  // Derive the filename from the resource record rather than the query string,
  // so a caller cannot control the Content-Disposition header.
  const displayName = resource.file_name || storagePath.split("/").pop() || "download";
  const safeName = displayName.replace(/["\\\r\n]/g, "");

  return new NextResponse(blob, {
    headers: {
      "Content-Type":
        fileRes.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Content-Length": blob.size.toString(),
    },
  });
}
