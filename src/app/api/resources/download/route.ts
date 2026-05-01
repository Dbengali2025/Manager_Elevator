import { NextRequest, NextResponse } from "next/server";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY ?? "";

export async function GET(request: NextRequest) {
  const storagePath = request.nextUrl.searchParams.get("path");
  const fileName = request.nextUrl.searchParams.get("name");

  if (!storagePath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
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

  // Redirect to the download URL (works for both direct and presigned)
  const downloadUrl = strategy.url;

  // Fetch the file and stream it back with proper headers for download
  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }

  const blob = await fileRes.blob();
  const displayName = fileName || storagePath.split("/").pop() || "download";

  return new NextResponse(blob, {
    headers: {
      "Content-Type":
        fileRes.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${displayName}"`,
      "Content-Length": blob.size.toString(),
    },
  });
}
