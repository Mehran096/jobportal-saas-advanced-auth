import { Schema, models, model } from "mongoose";

const BlogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: false, unique: true, lowercase: true, index: true }, // required: false karo
  
  excerpt: { type: String, required: true, maxlength: 300 },
  content: { type: String, required: true },
  
  coverImage: { type: String, default: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800" },
  
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  category: { 
    type: String, 
    default: "Career Guide", 
    enum: ["Career Guide", "Interview Tips", "Tech News", "Freelancing", "CV & Resume", "Job Market"] 
  },
  tags: [{ type: String, lowercase: true, trim: true }],

  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  metaKeywords: [{ type: String, lowercase: true }],
  canonicalUrl: { type: String },
  ogImage: { type: String },

  status: { type: String, default: "published", enum: ["draft", "published"] },
  views: { type: Number, default: 0 },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

// FIX: pre("validate") use karo, pre("save") nahi
BlogSchema.pre("validate", function() {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (!this.metaTitle) {
    this.metaTitle = this.title.substring(0, 60);
  }
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
  if (!this.ogImage && this.coverImage) {
    this.ogImage = this.coverImage;
  }
  if (!this.canonicalUrl && this.slug) {
    this.canonicalUrl = `https://yourdomain.com/blog/${this.slug}`;
  }
});

BlogSchema.index({ title: "text", excerpt: "text", tags: "text", metaKeywords: "text" });

const Blog = models.Blog || model("Blog", BlogSchema);
export default Blog;