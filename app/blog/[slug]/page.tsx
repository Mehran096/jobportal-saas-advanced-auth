import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Params = { params: Promise<{ slug: string }> };

interface BlogLean {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  views: number;
  createdAt: Date;
  metaTitle?: string;
  metaDescription?: string;
  author?: string;
}

export async function generateMetadata({ params }: Params) {
  await dbConnect();
  const { slug } = await params;
  const blog = (await Blog.findOne({ slug }).lean()) as unknown as BlogLean | null;
  if (!blog) return { title: "Not Found" };
  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: [blog.coverImage],
      type: "article",
    },
  };
}

export default async function BlogDetailPage({ params }: Params) {
  await dbConnect();
  const { slug } = await params;

  const blog = (await Blog.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { returnDocument: "after" }
  ).lean()) as unknown as BlogLean | null;

  if (!blog) notFound();

  // Related Blogs - same category
  const relatedBlogs = (await Blog.find({
    status: "published",
    category: blog.category,
    slug: { $ne: blog.slug },
  })
   .sort({ createdAt: -1 })
   .limit(3)
   .lean()) as unknown as BlogLean[];

  // SEO Schema for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage,
    datePublished: blog.createdAt,
    author: { "@type": "Person", name: blog.author || "Job Portal Admin" },
  };

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-sm text-blue-600 mb-6 inline-block">← Back to all blogs</Link>

      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{blog.category}</span>
      <h1 className="text-4xl font-bold mt-4 mb-4 leading-tight">{blog.title}</h1>
      <div className="flex gap-4 text-sm text-gray-500 mb-6">
        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
        <span>•</span>
        <span>{blog.views} views</span>
      </div>

      <div className="relative w-full h-[420px] mb-8">
        <Image src={blog.coverImage} alt={blog.title} fill className="object-cover rounded-xl" priority />
      </div>

      <div className="prose prose-lg max-w-none prose-a:text-blue-600" dangerouslySetInnerHTML={{ __html: blog.content }} />

      {/* Related Section */}
      {relatedBlogs.length > 0 && (
        <div className="mt-16 border-t pt-8">
          <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
          <div className="grid md:grid-cols-3 gap-5">
            {relatedBlogs.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="border rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className="relative w-full h-36">
                  <Image src={r.coverImage} alt={r.title} fill className="object-cover" />
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm line-clamp-2">{r.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}