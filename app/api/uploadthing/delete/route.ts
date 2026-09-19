import { UTApi } from "uploadthing/server";
export const dynamic = "force-dynamic";

const utapi = new UTApi();

function getKeyFromUrl(url: string): string {
  if (!url) return "";
  try {
    // Correct: get part after /f/, then take ONLY first segment before / or?
    if (url.includes("/f/")) {
      const afterF = url.split("/f/")[1];
      return afterF.split("/")[0].split("?")[0].trim();
    }
    // fallback
    return url.split("/").pop()?.split("?")[0] || "";
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // support both fileKey and url
    const fileKey = body.fileKey as string | undefined;
    const url = body.url as string | undefined;

    let key = fileKey || "";
    if (!key && url) key = getKeyFromUrl(url);

    if (!key) return Response.json({ error: "No key" }, { status: 400 });

    console.log("[DELETE] Trying to delete key:", key);
    const result = await utapi.deleteFiles(key);
    console.log("[DELETE] Result:", result);

    return Response.json({ success: true, deleted: key, result });
  } catch (err) {
    console.error("[DELETE] Error:", err);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}