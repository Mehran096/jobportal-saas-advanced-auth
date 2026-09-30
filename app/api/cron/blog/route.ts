import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CATEGORY_IMAGES: Record<string, string[]> = {
  "Career Guide": [
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=800",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800"
  ],
  "Interview Tips": [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800",
    "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=800",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800",
    "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?q=80&w=800",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800",
    "https://images.unsplash.com/photo-1590650046871-92c887180603?q=80&w=800"
  ],
  "Tech News": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800",
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=800",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=800",
    "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=800",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800"
  ],
  "CV & Resume": [
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800",
    "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?q=80&w=800",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800",
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800",
    "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?q=80&w=800",
    "https://images.unsplash.com/photo-1554774853-719586f82d77?q=80&w=800",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800"
  ],
  "Freelancing": [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
    "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=800",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb4?q=80&w=800",
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=800",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800"
  ],
  "Job Market": [
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
    "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?q=80&w=800",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=800"
  ]
};

const BLOG_TOPICS = [
  "Top 10 Tips for Job Interview in Pakistan 2026",
  "How to Write a Perfect CV for Freshers in Pakistan",
  "Future of AI Jobs in Pakistan 2026",
  "Remote Work vs Office Work - Which is Better?",
  "How to Get First Job as a MERN Stack Developer",
  "Best Programming Languages to Learn in 2026",
  "How to Negotiate Salary in Pakistan - Complete Guide",
  "LinkedIn Profile Optimization Guide for Job Seekers",
  "Freelancing vs Full-time Job in Pakistan",
  "How to Switch Career to IT in 2026",
  "Common CV Mistakes Pakistani Students Make in 2026",
  "Top IT Companies Hiring in Lahore Islamabad 2026",
  "How to Prepare for Technical Interview - MERN Stack",
  "Work From Home Jobs for Students in Pakistan 2026",
  "How to Build Portfolio Website for Developers",
  "Best Skills to Learn for High Salary in Pakistan",
  "How to Crack First Freelancing Project on Upwork",
  "Office Etiquette Tips for Fresh Graduates Pakistan",
  "AI Tools Every Job Seeker Should Use in 2026",
  "How to Find Jobs on Talent-Hive - Complete Tutorial"
];

const TOPIC_CATEGORY_MAP: Record<string,string> = {
  "CV": "CV & Resume","Resume": "CV & Resume","Mistakes": "CV & Resume","Portfolio": "CV & Resume",
  "Interview": "Interview Tips","Technical Interview": "Interview Tips","Etiquette": "Interview Tips",
  "MERN": "Tech News","Programming": "Tech News","AI Jobs": "Tech News","Developer": "Tech News","AI Tools": "Tech News","IT Companies": "Tech News","Skills": "Tech News",
  "Salary": "Career Guide","Negotiate": "Career Guide","Switch Career": "Career Guide","High Salary": "Career Guide",
  "LinkedIn": "Job Market","Talent-Hive": "Job Market","Find Jobs": "Job Market",
  "Remote": "Freelancing","Freelancing": "Freelancing","Work From Home": "Freelancing","Upwork": "Freelancing"
};

function detectCategory(topic: string){
  for(const k in TOPIC_CATEGORY_MAP){
    if(topic.toLowerCase().includes(k.toLowerCase())) return TOPIC_CATEGORY_MAP[k];
  }
  return "Career Guide";
}

function getSmartImage(cat: string, slug: string){
  const imgs = CATEGORY_IMAGES[cat] || CATEGORY_IMAGES["Career Guide"];
  const hashStr = slug + Date.now().toString() + Math.random().toString();
  const idx = hashStr.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % imgs.length;
  return `${imgs[idx]}&sig=${Math.floor(Math.random()*10000)}`;
}

function generateFallback(topic: string, category: string){
  return `<h1>${topic}</h1><p>Are you looking for practical guidance on <strong>${topic}</strong> in Pakistan? In 2026, job competition in Karachi, Lahore, and Islamabad is higher than ever. This Talent-Hive guide gives you real, actionable steps - no theory.</p><h2>Why ${topic} Matters Right Now in Pakistan?</h2><p>Recruiters in 2026 spend only 6 seconds on a CV. Companies like Systems Limited, 10Pearls, and Careem now check your LinkedIn and GitHub before calling. If you understand ${topic}, you will stand out from thousands of fresh graduates from FAST, UET, and Punjab University.</p><h2>Step-by-Step Practical Guide</h2><h3>1. Foundation</h3><p>Start with clarity. For ${topic}, don't copy templates. Write specific achievements with numbers. Example: Instead of "Made a website", write "Built a job portal with MERN that handled 1000+ job posts".</p><h3>2. Implementation for Pakistan Market</h3><p>Update your Talent-Hive profile 100%. Use keywords like "Pakistan Jobs 2026", "${category}". Connect with HR managers in Lahore, Islamabad, Karachi on LinkedIn. Join Rozee.pk, LinkedIn groups.</p><h3>3. What Top 1% Candidates Do Differently</h3><p>They spend 1 hour daily improving. They follow up after 3 days. They prepare answers in both English and Roman Urdu. For ${topic}, consistency beats talent.</p><h2>Mistakes That Reject Your Application</h2><ul><li><strong>Generic Applications:</strong> Same CV for every job.</li><li><strong>No Online Presence:</strong> No LinkedIn, no portfolio.</li><li><strong>Poor Communication:</strong> Weak English in interview.</li></ul><h2>Final Advice from Talent-Hive</h2><p>Apply within first 24 hours - you have 8x more chance. Learn one skill deeply. Master ${topic} this month and track your progress.</p>`;
}

export async function GET() {
  try {
    await dbConnect();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const existing = await Blog.find({}, { slug: 1, title: 1 }).lean();
    const existingTitles = existing.map((b: { title: string })=>b.title.toLowerCase());
    const existingSlugs = existing.map((b: { slug: string })=>b.slug.slice(0,30));

    const availableTopics = BLOG_TOPICS.filter(t =>!existingTitles.includes(t.toLowerCase()));
    const topicsPool = availableTopics.length > 0? availableTopics : BLOG_TOPICS;

    let topic = topicsPool[Math.floor(Math.random()*topicsPool.length)];
    for(let i=0;i<20;i++){
      const t = topicsPool[Math.floor(Math.random()*topicsPool.length)];
      const base = t.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);
      if(!existingSlugs.some((s: string)=>s.includes(base))){ topic=t; break; }
    }

    const category = detectCategory(topic);

    const prompt = `You are an expert career blogger writing for Talent-Hive, Pakistan's job portal. Write a DETAILED, HUMAN blog on Topic: "${topic}" Category: ${category}.

Rules:
- Write like a senior Pakistani career coach, not AI. Natural, helpful tone.
- NO repetitive phrases like "Complete 2026 guide". Make unique intro.
- Pakistan context: mention cities Karachi, Lahore, Islamabad, universities FAST, UET, NUST, companies Systems, Netsol, Careem.
- Return ONLY valid JSON: {"title": "SEO title 60 chars with Pakistan 2026, unique and catchy","slug": "seo-url-slug","excerpt": "Unique 150-160 chars summary related to topic, no generic text, human written","content": "HTML blog with <h1>${topic}</h1> then <p>180 words intro with real story</p> <h2>Why it matters in Pakistan 2026</h2><p>250 words with stats</p> <h2>Step-by-Step Guide</h2><h3>1. First Step</h3><p>150 words</p><h3>2. Second Step</h3><p>150 words</p><h3>3. Third Step</h3><p>150 words</p><h2>Common Mistakes</h2><ul><li>3 mistakes with bold heading</li></ul><h2>Pro Tips for Talent-Hive</h2><p>150 words actionable</p><h2>Conclusion</h2><p>100 words motivational</p> - MIN 800 WORDS HTML, related to topic","tags": ["pakistan jobs","${category.toLowerCase()}","2026","career", "2 more relevant tags"]}`;

    let blogData: { title: string; slug: string; excerpt: string; content: string; tags: string[] };
    try{
      const res = await groq.chat.completions.create({ model: "llama-3.1-8b-instant", messages: [{role:"user", content: prompt}], temperature: 0.85, max_tokens: 4000 });
      let raw = res.choices[0]?.message?.content || "";
      raw = raw.replace(/```json|```/g,'').trim();
      const m = raw.match(/\{[\s\S]*\}/);
      if(m) raw = m[0];
      blogData = JSON.parse(raw);
    }catch{
      blogData = {
        title: topic,
        slug: topic.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        excerpt: `Learn ${topic} with practical steps for Pakistani job seekers in 2026. Real tips for Talent-Hive users from Lahore, Karachi, Islamabad.`,
        content: generateFallback(topic, category),
        tags: ["pakistan jobs", category.toLowerCase(), "2026", "talent-hive", "career guide"]
      };
    }

    const admin = await User.findOne({role:"admin"}) || await User.findOne({});
    if(!admin){
      return NextResponse.json({ success: false, error: "No admin user found in DB" }, { status: 500 });
    }

    const finalSlugBase = blogData.slug.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const exists = await Blog.findOne({slug: finalSlugBase});
    const uniqueSlug = exists? `${finalSlugBase}-${Math.floor(Math.random()*9999)}` : finalSlugBase;
    const cover = getSmartImage(category, uniqueSlug);

    const blog = await Blog.create({
      title: blogData.title.slice(0,200),
      slug: uniqueSlug,
      excerpt: blogData.excerpt.slice(0,300),
      content: blogData.content,
      coverImage: cover,
      ogImage: cover,
      author: admin._id,
      category,
      tags: blogData.tags.map(t=>t.toLowerCase().trim()),
      metaTitle: blogData.title.slice(0,60),
      metaDescription: blogData.excerpt.slice(0,160),
      metaKeywords: blogData.tags.map(t=>t.toLowerCase().trim()),
      canonicalUrl: `https://jobportal.com/blog/${uniqueSlug}`,
      status: "published"
    });

    return NextResponse.json({ success: true, blog: { title: blog.title, slug: blog.slug, category, excerpt: blog.excerpt } });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}