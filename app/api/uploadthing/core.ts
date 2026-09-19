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
  .onUploadComplete(async ({ file, metadata }) => {
      console.log("✅ profile image:", file.key, "by", metadata.userId);
      // file.ufsUrl will be available on client as res[0].ufsUrl automatically
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  resume: f({
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
    text: { maxFileSize: "4MB", maxFileCount: 1 }, // allow doc if you want, remove if only PDF
  })
  .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Unauthorized");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = session.user as any;
      return { userId: user.id || user._id || user.email };
    })
  .onUploadComplete(async ({ file, metadata }) => {
      console.log("✅ resume:", file.name, file.key, "by", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;