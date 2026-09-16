import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

export function getFileKeyFromUrl(url: string) {
  // https://s7cs7dje8i.ufs.sh/f/xxxx -> xxxx
  try {
    const parts = url.split("/f/");
    return parts[1]?.split("/")[0] || "";
  } catch { return ""; }
}