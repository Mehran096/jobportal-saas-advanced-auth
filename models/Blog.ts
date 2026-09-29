import { Schema, models, model } from "mongoose";

const BlogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  
  // Short description for listing page
  excerpt: { type: String, required: true, maxlength: 300 },
  
  // Full HTML Content
  content: { type: String, required: true },
  
  coverImage: { type: String, default: "" },
  
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  category: { 
    type: String, 
    default: "Career Guide", 
    enum: ["Career Guide", "Interview Tips", "Tech News", "Freelancing", "CV & Resume", "Job Market"] 
  },
  tags: [{ type: String, lowercase: true, trim: true }],

  // ===== SEO FIELDS =====
  metaTitle: { type: String, maxlength: 60 }, // 60 char for Google
  metaDescription: { type: String, maxlength: 160 }, // 160 char for Google
  metaKeywords: [{ type: String }],
  canonicalUrl: { type: String },
  ogImage: { type: String }, // For Facebook/LinkedIn share

  status: { type: String, default: "published", enum: ["draft", "published"] },
  views: { type: Number, default: 0 },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isFeatured: { type: Boolean, default: false },

}, { 
  timestamps: true 
});

// Auto-generate SEO if not provided
BlogSchema.pre("save", function() {
  if (!this.metaTitle) {
    this.metaTitle = this.title.substring(0, 60);
  }
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  
});

BlogSchema.index({ title: "text", excerpt: "text", tags: "text", metaKeywords: "text" });

const Blog = models.Blog || model("Blog", BlogSchema);
export default Blog;