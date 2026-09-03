import { content, siteSettings } from "@hecy/content/schema";
import { defaultSettings, seedContent } from "@hecy/content/seed";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("缺少 DATABASE_URL。");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

for (const item of seedContent) {
  await db
    .insert(content)
    .values({
      id: item.id,
      type: item.type,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      body: item.body,
      coverUrl: item.coverUrl,
      tags: item.tags,
      lang: item.lang,
      status: item.status,
      featured: item.featured,
      sortOrder: item.sortOrder,
      productFields: item.product,
      projectFields: item.project,
      seo: item.seo,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })
    .onConflictDoUpdate({
      target: content.id,
      set: {
        title: item.title,
        excerpt: item.excerpt,
        body: item.body,
        updatedAt: new Date(),
      },
    });
}

await db
  .insert(siteSettings)
  .values({
    id: "site",
    value: defaultSettings,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: siteSettings.id,
    set: { value: defaultSettings, updatedAt: new Date() },
  });

await pool.end();
console.log(`已写入 ${seedContent.length} 条内容。`);
