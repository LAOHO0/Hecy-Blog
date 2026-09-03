import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "../../packages/content/src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://hecy:hecy@localhost:5432/hecy_blog",
  },
});
