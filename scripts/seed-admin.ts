import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function seedAdmin() {
  const { default: dbConnect } = await import("@/lib/db");
  const { default: User } = await import("@/models/User");
  const bcrypt = await import("bcryptjs").then(m => m.default);
  await dbConnect();

  const hashed = await bcrypt.hash("admin@12345", 12);
  
  await User.create({
    firstName: "Super",
    lastName: "Admin",
    email: "admin@jobportal.com",
    password: hashed, // manual hash needed because your model has no hook
    role: "admin",
    provider: "credentials",
    isBanned: false,
  });
  console.log("✅ Admin re-created correctly");
  process.exit(0);
}
seedAdmin();