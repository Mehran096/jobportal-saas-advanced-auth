export const dynamic = 'force-dynamic';

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

  const relatedBlogs = (await Blog.find({
    status: "published",
    category: blog.category,
    slug: { $ne: blog.slug },
  })
  .sort({ createdAt: -1 })
  .limit(3)
  .lean()) as unknown as BlogLean[];

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
    <article className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-sm text-blue-600 mb-4 md:mb-6 inline-block hover:underline">
        ← Back to all blogs
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm font-medium">
          {blog.category}
        </span>
        <span className="text-xs md:text-sm text-gray-500">
          {new Date(blog.createdAt).toLocaleDateString()} • {blog.views} views
        </span>
      </div>

      <h1 className="text-2xl md:text-4xl font-bold mt-2 mb-4 leading-tight md:leading-tight">
        {blog.title}
      </h1>

      <p className="text-gray-600 text-base md:text-lg mb-6 leading-relaxed">{blog.excerpt}</p>

      {/* Responsive Cover Image */}
      <div className="relative w-full h-55 md:h-105 mb-6 md:mb-8">
        <Image
          src={blog.coverImage}
          alt={blog.title}
          fill
          className="object-cover rounded-xl"
          priority
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>

      {/* Content - Responsive Prose */}
      <div
        className="prose prose-base md:prose-lg max-w-none
        prose-h2:text-xl md:prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8
        prose-p:leading-7 prose-p:text-gray-700 prose-p:text-[15px] md:prose-p:text-base
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-xl prose-img:w-full"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Related Section - Responsive */}
      {relatedBlogs.length > 0 && (
        <div className="mt-12 md:mt-16 border-t pt-6 md:pt-8">
          <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Related Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {relatedBlogs.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-white">
                <div className="relative w-full h-48 sm:h-36">
                  <Image src={r.coverImage} alt={r.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-3">
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full">{r.category}</span>
                  <h4 className="font-semibold text-sm line-clamp-2 mt-2 leading-snug">{r.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}