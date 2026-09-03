import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const content = pgTable(
  "content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    coverUrl: text("cover_url"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    lang: text("lang").notNull().default("zh-CN"),
    status: text("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    productFields: jsonb("product_fields"),
    projectFields: jsonb("project_fields"),
    seo: jsonb("seo").$type<Record<string, unknown>>().notNull().default({}),
    previewToken: text("preview_token"),
    previewExpiresAt: timestamp("preview_expires_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("content_slug_unique").on(table.type, table.slug),
    statusIndex: index("content_status_idx").on(table.status),
    typeIndex: index("content_type_idx").on(table.type),
  }),
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id").notNull(),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    contentVersionIndex: index("content_versions_content_idx").on(
      table.contentId,
    ),
    contentVersionUnique: uniqueIndex(
      "content_versions_content_version_unique",
    ).on(table.contentId, table.version),
  }),
);

export const buildJobs = pgTable(
  "build_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: text("status").notNull().default("queued"),
    commitSha: text("commit_sha"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    errorSummary: text("error_summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    buildStatusIndex: index("build_jobs_status_idx").on(table.status),
  }),
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    alt: text("alt"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    keyUnique: uniqueIndex("media_assets_key_unique").on(table.key),
  }),
);

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const slugRedirects = pgTable(
  "slug_redirects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    fromSlug: text("from_slug").notNull(),
    toSlug: text("to_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    fromSlugUnique: uniqueIndex("slug_redirects_from_unique").on(
      table.type,
      table.fromSlug,
    ),
  }),
);
