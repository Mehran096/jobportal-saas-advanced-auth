import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  profileImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
   .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Unauthorized");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = session.user as any;
      return { userId: user.id || user._id || user.email };
    })
   .onUploadComplete(async ({ file }) => {
      console.log("✅ profile image uploaded:", file.ufsUrl);
      // ufsUrl is automatically available on client as res[0].ufsUrl
      // we also return it in serverData for safety
      return { ufsUrl: file.ufsUrl };
    }),

  resume: f({
    // allow pdf + doc for more users
    blob: { maxFileSize: "4MB", maxFileCount: 1 }
  })
   .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Unauthorized");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = session.user as any;
      return { userId: user.id || user._id || user.email };
    })
   .onUploadComplete(async ({ file }) => {
      console.log("✅ resume uploaded:", file.ufsUrl, file.name);
      return { ufsUrl: file.ufsUrl, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;