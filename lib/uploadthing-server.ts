import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

export function getFileKeyFromUrl(url: string): string {
  if (!url) return "";
  try {
    // Works for both:
    // https://s7cs7dje8i.ufs.sh/f/abc123
    // https://s7cs7dje8i.ufs.sh/f/abc123/profile%202.jpg
    // https://s7cs7dje8i.ufs.sh/f/abc123?x=1
    if (url.includes("/f/")) {
      return url.split("/f/")[1].split("/")[0].split("?")[0].trim();
    }
    // If someone passes key directly, return it
    return url.split("/").pop()?.split("?")[0].trim() || "";
  } catch {
    return "";
  }
}