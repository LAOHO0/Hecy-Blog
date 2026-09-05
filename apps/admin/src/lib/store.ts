import "server-only";

import {
  buildJobs,
  content as contentTable,
  contentVersions,
  mediaAssets,
  siteSettings,
  slugRedirects,
} from "@hecy/content/schema";
import { defaultSettings, seedContent } from "@hecy/content/seed";
import { normalizeSiteSettings } from "@hecy/content/settings";
import type {
  BuildRecord,
  ContentRecord,
  ContentStatus,
  ContentVersion,
  MediaAsset,
  SiteSettings,
} from "@hecy/content/types";
import type { ContentInput } from "@hecy/content/validation";
import { and, desc, eq, max, ne, or } from "drizzle-orm";
import { getDatabase } from "./db";

type ListOptions = {
  type?: ContentRecord["type"];
  status?: ContentStatus;
  query?: string;
};

type MemoryState = {
  content: ContentRecord[];
  versions: ContentVersion[];
  builds: BuildRecord[];
  media: MediaAsset[];
  settings: SiteSettings;
  redirects: Record<string, string>;
};

function redirectKey(type: ContentRecord["type"], slug: string) {
  return `${type}:${slug}`;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const globalForStore = globalThis as unknown as {
  hecyMemory?: MemoryState;
};

function getMemory(): MemoryState {
  if (!globalForStore.hecyMemory) {
    globalForStore.hecyMemory = {
      content: clone(seedContent),
      versions: [],
      builds: [
        {
          id: "build-demo-1",
          status: "success",
          commitSha: "demo-seed",
          finishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      media: [],
      settings: clone(defaultSettings),
      redirects: {},
    };
  }
  // Hot reloads can retain a state object created by an older module version.
  // Normalize it so slug redirects remain safe during development.
  if (!globalForStore.hecyMemory.redirects) {
    globalForStore.hecyMemory.redirects = {};
  }
  return globalForStore.hecyMemory;
}

async function assertSlugAvailable(
  type: ContentRecord["type"],
  slug: string,
  contentId?: string,
) {
  const db = getDatabase();
  if (db) {
    const condition = contentId
      ? and(
          eq(contentTable.type, type),
          eq(contentTable.slug, slug),
          ne(contentTable.id, contentId),
        )
      : and(eq(contentTable.type, type), eq(contentTable.slug, slug));
    const [existing] = await db
      .select({ id: contentTable.id })
      .from(contentTable)
      .where(condition)
      .limit(1);
    if (existing) throw new Error("SLUG_EXISTS");
    return;
  }

  const exists = getMemory().content.some(
    (item) => item.type === type && item.slug === slug && item.id !== contentId,
  );
  if (exists) throw new Error("SLUG_EXISTS");
}

async function saveSlugRedirect(
  type: ContentRecord["type"],
  fromSlug: string,
  toSlug: string,
  createdAt: Date,
) {
  if (fromSlug === toSlug) return;
  const db = getDatabase();
  if (db) {
    // The destination becomes the current URL, so it must not keep an older
    // redirect of its own (for example a → b → c → a).
    await db
      .delete(slugRedirects)
      .where(
        and(eq(slugRedirects.type, type), eq(slugRedirects.fromSlug, toSlug)),
      );
    // Collapse an existing chain (a → b → c becomes a → c) before adding the
    // latest redirect. This keeps old links working after repeated renames.
    await db
      .update(slugRedirects)
      .set({ toSlug, createdAt })
      .where(
        and(eq(slugRedirects.type, type), eq(slugRedirects.toSlug, fromSlug)),
      );
    await db
      .insert(slugRedirects)
      .values({ type, fromSlug, toSlug, createdAt })
      .onConflictDoUpdate({
        target: [slugRedirects.type, slugRedirects.fromSlug],
        set: { toSlug, createdAt },
      });
    return;
  }

  const memory = getMemory();
  delete memory.redirects[redirectKey(type, toSlug)];
  for (const [oldSlug, targetSlug] of Object.entries(memory.redirects)) {
    if (
      oldSlug.startsWith(`${type}:`) &&
      targetSlug === redirectKey(type, fromSlug)
    ) {
      memory.redirects[oldSlug] = redirectKey(type, toSlug);
    }
  }
  memory.redirects[redirectKey(type, fromSlug)] = redirectKey(type, toSlug);
}

async function clearSlugRedirect(type: ContentRecord["type"], slug: string) {
  const db = getDatabase();
  if (db) {
    await db
      .delete(slugRedirects)
      .where(
        and(eq(slugRedirects.type, type), eq(slugRedirects.fromSlug, slug)),
      );
    return;
  }
  delete getMemory().redirects[redirectKey(type, slug)];
}

async function resolveRedirect(type: ContentRecord["type"], slug: string) {
  const db = getDatabase();
  if (db) {
    let current = slug;
    const seen = new Set<string>();
    for (let step = 0; step < 10 && !seen.has(current); step += 1) {
      seen.add(current);
      const [row] = await db
        .select({ toSlug: slugRedirects.toSlug })
        .from(slugRedirects)
        .where(
          and(
            eq(slugRedirects.type, type),
            eq(slugRedirects.fromSlug, current),
          ),
        );
      if (!row?.toSlug) return current === slug ? undefined : current;
      current = row.toSlug;
    }
    return current === slug ? undefined : current;
  }

  const originalKey = redirectKey(type, slug);
  let current = originalKey;
  const seen = new Set<string>();
  const redirects = getMemory().redirects;
  for (let step = 0; step < 10 && !seen.has(current); step += 1) {
    seen.add(current);
    const next = redirects[current];
    if (!next)
      return current === originalKey ? undefined : current.split(":")[1];
    current = next;
  }
  return current === originalKey ? undefined : current.split(":")[1];
}

const dateValue = (value: unknown, fallback = new Date()) =>
  value instanceof Date
    ? value.toISOString()
    : typeof value === "string"
      ? new Date(value).toISOString()
      : fallback.toISOString();

function rowToContent(row: Record<string, unknown>): ContentRecord {
  return {
    id: String(row.id),
    type: row.type as ContentRecord["type"],
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    coverUrl: row.coverUrl ? String(row.coverUrl) : undefined,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((item): item is string => typeof item === "string")
      : [],
    lang: String(row.lang ?? "zh-CN"),
    status: row.status as ContentStatus,
    featured: Boolean(row.featured),
    sortOrder: Number(row.sortOrder ?? 0),
    product: row.productFields
      ? (row.productFields as ContentRecord["product"])
      : undefined,
    project: row.projectFields
      ? (row.projectFields as ContentRecord["project"])
      : undefined,
    seo: (row.seo as ContentRecord["seo"]) ?? { keywords: [] },
    previewToken: row.previewToken ? String(row.previewToken) : undefined,
    previewExpiresAt: row.previewExpiresAt
      ? dateValue(row.previewExpiresAt)
      : undefined,
    publishedAt: row.publishedAt ? dateValue(row.publishedAt) : undefined,
    createdAt: dateValue(row.createdAt),
    updatedAt: dateValue(row.updatedAt),
  };
}

function inputToRecord(
  input: ContentInput,
  id: string,
  now = new Date(),
): ContentRecord {
  const seo = {
    ...input.seo,
    title: input.seo.title || input.title,
    description: input.seo.description || input.excerpt,
    keywords: input.seo.keywords.length ? input.seo.keywords : input.tags,
  };
  return {
    id,
    type: input.type,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    coverUrl: input.coverUrl || undefined,
    tags: input.tags,
    lang: input.lang,
    status: "draft",
    featured: input.featured,
    sortOrder: input.sortOrder,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    product: input.product,
    project: input.project,
    seo,
  };
}

function matches(record: ContentRecord, options: ListOptions) {
  if (options.type && record.type !== options.type) return false;
  if (options.status && record.status !== options.status) return false;
  if (options.query) {
    const haystack = [record.title, record.slug, record.excerpt, ...record.tags]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(options.query.toLowerCase())) return false;
  }
  return true;
}

function sortContent(records: ContentRecord[]) {
  return records.sort((left, right) => {
    if (left.featured !== right.featured) return left.featured ? -1 : 1;
    if (left.sortOrder !== right.sortOrder)
      return left.sortOrder - right.sortOrder;
    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

async function dbRows() {
  const db = getDatabase();
  if (!db) return null;
  return db.select().from(contentTable);
}

export async function listContent(
  options: ListOptions = {},
): Promise<ContentRecord[]> {
  const rows = await dbRows();
  if (rows) {
    const records = rows.map((row) =>
      rowToContent(row as unknown as Record<string, unknown>),
    );
    return sortContent(records.filter((record) => matches(record, options)));
  }

  return sortContent(
    clone(getMemory().content).filter((record) => matches(record, options)),
  );
}

export async function listPublishedContent(type?: ContentRecord["type"]) {
  return listContent({ status: "published", type });
}

export async function getContent(id: string) {
  const db = getDatabase();
  if (db) {
    const [row] = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.id, id))
      .limit(1);
    return row
      ? rowToContent(row as unknown as Record<string, unknown>)
      : undefined;
  }
  const record = getMemory().content.find((item) => item.id === id);
  return record ? clone(record) : undefined;
}

export async function getContentBySlug(
  slug: string,
  type?: ContentRecord["type"],
) {
  const db = getDatabase();
  if (db) {
    if (type) {
      const [row] = await db
        .select()
        .from(contentTable)
        .where(and(eq(contentTable.type, type), eq(contentTable.slug, slug)))
        .limit(1);
      return row
        ? rowToContent(row as unknown as Record<string, unknown>)
        : undefined;
    }
    // 同一 slug 可能被文章、产品、项目同时使用，保持与列表一致的排序规则。
    const rows = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.slug, slug));
    const records = sortContent(
      rows.map((row) =>
        rowToContent(row as unknown as Record<string, unknown>),
      ),
    );
    return records[0];
  }
  const matches = getMemory().content.filter(
    (item) => item.slug === slug && (!type || item.type === type),
  );
  return sortContent(matches.map(clone))[0];
}

export async function getPreviewByToken(token: string) {
  const db = getDatabase();
  if (db) {
    const [row] = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.previewToken, token))
      .limit(1);
    if (!row) return undefined;
    const record = rowToContent(row as unknown as Record<string, unknown>);
    if (
      !record.previewExpiresAt ||
      new Date(record.previewExpiresAt).getTime() < Date.now()
    ) {
      return undefined;
    }
    return record;
  }
  const record = getMemory().content.find(
    (item) => item.previewToken === token,
  );
  if (!record) return undefined;
  if (
    !record.previewExpiresAt ||
    new Date(record.previewExpiresAt).getTime() < Date.now()
  )
    return undefined;
  return clone(record);
}

export async function createContent(input: ContentInput) {
  const now = new Date();
  const id = crypto.randomUUID();
  const record = inputToRecord(input, id, now);
  const db = getDatabase();
  await assertSlugAvailable(record.type, record.slug);

  if (db) {
    const [row] = await db
      .insert(contentTable)
      .values({
        id,
        type: record.type,
        slug: record.slug,
        title: record.title,
        excerpt: record.excerpt,
        body: record.body,
        coverUrl: record.coverUrl,
        tags: record.tags,
        lang: record.lang,
        status: record.status,
        featured: record.featured,
        sortOrder: record.sortOrder,
        productFields: record.product,
        projectFields: record.project,
        seo: record.seo,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await clearSlugRedirect(record.type, record.slug);
    return rowToContent(row as unknown as Record<string, unknown>);
  }

  const memory = getMemory();
  memory.content.unshift(record);
  await clearSlugRedirect(record.type, record.slug);
  return clone(record);
}

export async function updateContent(id: string, input: ContentInput) {
  const current = await getContent(id);
  if (!current) return undefined;
  if (current.type !== input.type) {
    throw new Error("CONTENT_TYPE_IMMUTABLE");
  }
  const now = new Date();
  const next = {
    ...inputToRecord(input, id, new Date(current.createdAt)),
    status: current.status,
    publishedAt: current.publishedAt,
    previewToken: current.previewToken,
    previewExpiresAt: current.previewExpiresAt,
    updatedAt: now.toISOString(),
  } satisfies ContentRecord;
  const db = getDatabase();

  await assertSlugAvailable(next.type, next.slug, id);
  await createVersion(current, "admin");

  if (db) {
    if (current.slug !== next.slug) {
      await saveSlugRedirect(current.type, current.slug, next.slug, now);
    }
    const [row] = await db
      .update(contentTable)
      .set({
        type: next.type,
        slug: next.slug,
        title: next.title,
        excerpt: next.excerpt,
        body: next.body,
        coverUrl: next.coverUrl ?? null,
        tags: next.tags,
        lang: next.lang,
        featured: next.featured,
        sortOrder: next.sortOrder,
        productFields: next.product ?? null,
        projectFields: next.project ?? null,
        seo: next.seo,
        updatedAt: now,
      })
      .where(eq(contentTable.id, id))
      .returning();
    return rowToContent(row as unknown as Record<string, unknown>);
  }

  const memory = getMemory();
  const index = memory.content.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  memory.content[index] = clone(next);
  if (current.slug !== next.slug) {
    await saveSlugRedirect(current.type, current.slug, next.slug, now);
  }
  return clone(next);
}

export async function deleteContent(id: string) {
  const removed = await getContent(id);
  if (!removed) return false;
  const db = getDatabase();
  if (db) {
    const deleted = await db
      .delete(contentTable)
      .where(eq(contentTable.id, id))
      .returning({ id: contentTable.id });
    if (deleted.length > 0) {
      await db.delete(contentVersions).where(eq(contentVersions.contentId, id));
      await db
        .delete(slugRedirects)
        .where(
          and(
            eq(slugRedirects.type, removed.type),
            or(
              eq(slugRedirects.fromSlug, removed.slug),
              eq(slugRedirects.toSlug, removed.slug),
            ),
          ),
        );
    }
    return deleted.length > 0;
  }
  const memory = getMemory();
  const before = memory.content.length;
  memory.content = memory.content.filter((item) => item.id !== id);
  memory.versions = memory.versions.filter(
    (version) => version.contentId !== removed.id,
  );
  const removedKey = redirectKey(removed.type, removed.slug);
  for (const [fromSlug, toSlug] of Object.entries(memory.redirects)) {
    if (fromSlug === removedKey || toSlug === removedKey) {
      delete memory.redirects[fromSlug];
    }
  }
  return memory.content.length < before;
}

async function createVersion(record: ContentRecord, createdBy: string) {
  const db = getDatabase();
  let versionNumber: number;
  if (db) {
    // 只聚合版本号，避免为了计数把所有历史快照加载进内存。
    const [aggregate] = await db
      .select({ maxVersion: max(contentVersions.version) })
      .from(contentVersions)
      .where(eq(contentVersions.contentId, record.id));
    versionNumber = (aggregate?.maxVersion ?? 0) + 1;
  } else {
    versionNumber = (await listVersions(record.id)).length + 1;
  }
  const version: ContentVersion = {
    id: crypto.randomUUID(),
    contentId: record.id,
    version: versionNumber,
    snapshot: clone(record),
    createdAt: new Date().toISOString(),
    createdBy,
  };

  if (db) {
    await db.insert(contentVersions).values({
      id: version.id,
      contentId: version.contentId,
      version: version.version,
      snapshot: version.snapshot,
      createdBy: version.createdBy,
      createdAt: new Date(version.createdAt),
    });
  } else {
    getMemory().versions.unshift(version);
  }
  return version;
}

export async function listVersions(
  contentId: string,
): Promise<ContentVersion[]> {
  const db = getDatabase();
  if (db) {
    const rows = await db
      .select()
      .from(contentVersions)
      .where(eq(contentVersions.contentId, contentId))
      .orderBy(desc(contentVersions.version));
    return rows.map((row) => ({
      id: row.id,
      contentId: row.contentId,
      version: row.version,
      snapshot: row.snapshot as ContentRecord,
      createdAt: dateValue(row.createdAt),
      createdBy: row.createdBy,
    }));
  }
  return getMemory()
    .versions.filter((version) => version.contentId === contentId)
    .sort((left, right) => right.version - left.version)
    .map(clone);
}

export async function restoreVersion(contentId: string, versionId: string) {
  const versions = await listVersions(contentId);
  const version = versions.find((item) => item.id === versionId);
  if (!version) return undefined;
  const current = await getContent(contentId);
  if (!current) return undefined;
  const restored = {
    ...clone(version.snapshot),
    updatedAt: new Date().toISOString(),
    previewToken: undefined,
    previewExpiresAt: undefined,
  };
  if (current.type !== restored.type) {
    throw new Error("CONTENT_TYPE_IMMUTABLE");
  }
  await assertSlugAvailable(restored.type, restored.slug, contentId);
  await createVersion(current, "admin-restore");
  const db = getDatabase();
  if (current.slug !== restored.slug) {
    await saveSlugRedirect(
      current.type,
      current.slug,
      restored.slug,
      new Date(),
    );
  }
  if (db) {
    const [row] = await db
      .update(contentTable)
      .set({
        type: restored.type,
        slug: restored.slug,
        title: restored.title,
        excerpt: restored.excerpt,
        body: restored.body,
        coverUrl: restored.coverUrl ?? null,
        tags: restored.tags,
        lang: restored.lang,
        status: restored.status,
        featured: restored.featured,
        sortOrder: restored.sortOrder,
        productFields: restored.product ?? null,
        projectFields: restored.project ?? null,
        previewToken: null,
        previewExpiresAt: null,
        publishedAt: restored.publishedAt
          ? new Date(restored.publishedAt)
          : null,
        seo: restored.seo,
        updatedAt: new Date(),
      })
      .where(eq(contentTable.id, contentId))
      .returning();
    return rowToContent(row as unknown as Record<string, unknown>);
  }
  const memory = getMemory();
  const index = memory.content.findIndex((item) => item.id === contentId);
  if (index < 0) return undefined;
  memory.content[index] = restored;
  return clone(restored);
}

export async function publishContent(id: string) {
  const current = await getContent(id);
  if (!current) return undefined;
  await createVersion(current, "admin-publish");
  const now = new Date();
  const db = getDatabase();

  if (db) {
    const [row] = await db
      .update(contentTable)
      .set({
        status: "published",
        publishedAt: now,
        previewToken: null,
        previewExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(contentTable.id, id))
      .returning();
    return rowToContent(row as unknown as Record<string, unknown>);
  }

  const memory = getMemory();
  const index = memory.content.findIndex((item) => item.id === id);
  memory.content[index] = {
    ...memory.content[index],
    status: "published",
    publishedAt: now.toISOString(),
    previewToken: undefined,
    previewExpiresAt: undefined,
    updatedAt: now.toISOString(),
  };
  return clone(memory.content[index]);
}

export async function revokeContent(id: string) {
  const current = await getContent(id);
  if (!current) return undefined;
  await createVersion(current, "admin-revoke");
  const now = new Date();
  const db = getDatabase();

  if (db) {
    const [row] = await db
      .update(contentTable)
      .set({
        status: "draft",
        publishedAt: null,
        previewToken: null,
        previewExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(contentTable.id, id))
      .returning();
    return rowToContent(row as unknown as Record<string, unknown>);
  }

  const memory = getMemory();
  const index = memory.content.findIndex((item) => item.id === id);
  memory.content[index] = {
    ...memory.content[index],
    status: "draft",
    publishedAt: undefined,
    previewToken: undefined,
    previewExpiresAt: undefined,
    updatedAt: now.toISOString(),
  };
  return clone(memory.content[index]);
}

export async function createPreview(id: string, minutes = 60) {
  const current = await getContent(id);
  if (!current) return undefined;
  const token = crypto.randomUUID().replaceAll("-", "");
  const expires = new Date(Date.now() + minutes * 60_000);
  const db = getDatabase();

  if (db) {
    const [row] = await db
      .update(contentTable)
      .set({
        previewToken: token,
        previewExpiresAt: expires,
        updatedAt: new Date(),
      })
      .where(eq(contentTable.id, id))
      .returning();
    return {
      content: rowToContent(row as unknown as Record<string, unknown>),
      token,
      expiresAt: expires.toISOString(),
    };
  }

  const memory = getMemory();
  const index = memory.content.findIndex((item) => item.id === id);
  memory.content[index] = {
    ...memory.content[index],
    previewToken: token,
    previewExpiresAt: expires.toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return {
    content: clone(memory.content[index]),
    token,
    expiresAt: expires.toISOString(),
  };
}

export async function listBuilds(): Promise<BuildRecord[]> {
  const db = getDatabase();
  if (db) {
    const rows = await db
      .select()
      .from(buildJobs)
      .orderBy(desc(buildJobs.createdAt));
    return rows.map((row) => ({
      id: row.id,
      status: row.status as BuildRecord["status"],
      commitSha: row.commitSha ?? undefined,
      startedAt: row.startedAt ? dateValue(row.startedAt) : undefined,
      finishedAt: row.finishedAt ? dateValue(row.finishedAt) : undefined,
      errorSummary: row.errorSummary ?? undefined,
      createdAt: dateValue(row.createdAt),
    }));
  }
  return getMemory()
    .builds.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(clone);
}

export async function getBuild(id: string): Promise<BuildRecord | undefined> {
  const db = getDatabase();
  if (db) {
    const [row] = await db.select().from(buildJobs).where(eq(buildJobs.id, id));
    if (!row) return undefined;
    return {
      id: row.id,
      status: row.status as BuildRecord["status"],
      commitSha: row.commitSha ?? undefined,
      startedAt: row.startedAt ? dateValue(row.startedAt) : undefined,
      finishedAt: row.finishedAt ? dateValue(row.finishedAt) : undefined,
      errorSummary: row.errorSummary ?? undefined,
      createdAt: dateValue(row.createdAt),
    };
  }
  const build = getMemory().builds.find((item) => item.id === id);
  return build ? clone(build) : undefined;
}

export async function createBuild() {
  const now = new Date();
  const id = crypto.randomUUID();
  const db = getDatabase();
  if (db) {
    const [row] = await db
      .insert(buildJobs)
      .values({ id, status: "queued", createdAt: now })
      .returning();
    return {
      id: row.id,
      status: row.status as BuildRecord["status"],
      createdAt: dateValue(row.createdAt),
    } satisfies BuildRecord;
  }
  const build: BuildRecord = {
    id,
    status: "queued",
    createdAt: now.toISOString(),
  };
  getMemory().builds.unshift(build);
  return clone(build);
}

export async function markBuild(
  id: string,
  status: BuildRecord["status"],
  errorSummary?: string,
  commitSha?: string,
) {
  const now = new Date();
  const db = getDatabase();
  if (db) {
    const [row] = await db
      .update(buildJobs)
      .set({
        status,
        errorSummary: errorSummary ?? null,
        ...(commitSha ? { commitSha } : {}),
        startedAt: status === "running" ? now : undefined,
        finishedAt: ["success", "failed"].includes(status) ? now : undefined,
      })
      .where(eq(buildJobs.id, id))
      .returning();
    return row
      ? {
          id: row.id,
          status: row.status as BuildRecord["status"],
          errorSummary: row.errorSummary ?? undefined,
          createdAt: dateValue(row.createdAt),
          startedAt: row.startedAt ? dateValue(row.startedAt) : undefined,
          finishedAt: row.finishedAt ? dateValue(row.finishedAt) : undefined,
        }
      : undefined;
  }
  const build = getMemory().builds.find((item) => item.id === id);
  if (!build) return undefined;
  build.status = status;
  build.errorSummary = errorSummary;
  if (commitSha) build.commitSha = commitSha;
  if (status === "running") build.startedAt = now.toISOString();
  if (status === "success" || status === "failed")
    build.finishedAt = now.toISOString();
  return clone(build);
}

export async function getSettings(): Promise<SiteSettings> {
  const db = getDatabase();
  if (db) {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "site"));
    if (row?.value) {
      return normalizeSiteSettings(row.value as SiteSettings);
    }
  }
  // 内存模式同样要归一化：旧进程/旧数据可能缺 homepage、background 字段。
  return normalizeSiteSettings(clone(getMemory().settings));
}

export async function updateSettings(settings: SiteSettings) {
  const db = getDatabase();
  const now = new Date();
  if (db) {
    const [row] = await db
      .insert(siteSettings)
      .values({ id: "site", value: settings, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { value: settings, updatedAt: now },
      })
      .returning();
    return row.value as SiteSettings;
  }
  getMemory().settings = clone(settings);
  return clone(settings);
}

export async function listMedia(): Promise<MediaAsset[]> {
  const db = getDatabase();
  if (db) {
    const rows = await db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt));
    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      url: row.url,
      mimeType: row.mimeType,
      size: row.size,
      alt: row.alt ?? undefined,
      createdAt: dateValue(row.createdAt),
    }));
  }
  return getMemory().media.map(clone);
}

export async function addMedia(asset: Omit<MediaAsset, "id" | "createdAt">) {
  const now = new Date();
  const record: MediaAsset = {
    ...asset,
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
  };
  const db = getDatabase();
  if (db) {
    const [row] = await db
      .insert(mediaAssets)
      .values({
        id: record.id,
        key: record.key,
        url: record.url,
        mimeType: record.mimeType,
        size: record.size,
        alt: record.alt,
        createdAt: now,
      })
      .returning();
    return {
      id: row.id,
      key: row.key,
      url: row.url,
      mimeType: row.mimeType,
      size: row.size,
      alt: row.alt ?? undefined,
      createdAt: dateValue(row.createdAt),
    };
  }
  getMemory().media.unshift(record);
  return clone(record);
}

export async function getRedirect(type: ContentRecord["type"], slug: string) {
  return resolveRedirect(type, slug);
}

export async function listRedirects(type?: ContentRecord["type"]) {
  const db = getDatabase();
  if (db) {
    const rows = await db.select().from(slugRedirects);
    const published = new Set(
      (await listPublishedContent(type)).map(
        (item) => `${item.type}:${item.slug}`,
      ),
    );
    return rows
      .filter(
        (row) =>
          (!type || row.type === type) &&
          published.has(`${row.type}:${row.toSlug}`),
      )
      .map((row) => ({
        type: row.type as ContentRecord["type"],
        fromSlug: row.fromSlug,
        toSlug: row.toSlug,
      }));
  }

  const published = new Set(
    (await listPublishedContent(type)).map(
      (item) => `${item.type}:${item.slug}`,
    ),
  );
  return Object.entries(getMemory().redirects)
    .map(([key, target]) => {
      const separator = key.indexOf(":");
      const targetSeparator = target.indexOf(":");
      return {
        type: key.slice(0, separator) as ContentRecord["type"],
        fromSlug: key.slice(separator + 1),
        toSlug: target.slice(targetSeparator + 1),
      };
    })
    .filter(
      (item) =>
        (!type || item.type === type) &&
        published.has(`${item.type}:${item.toSlug}`),
    );
}
