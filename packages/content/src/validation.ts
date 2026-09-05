import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "只支持 http 或 https 链接。" },
  );

const optionalHttpUrl = httpUrl.optional().or(z.literal(""));

// 图标允许站内路径（如 /imgs/logo.webp），也允许 http(s) 图片链接
const optionalIcon = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/") && !value.startsWith("//")) return true;
      try {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "图标只支持 http(s) 链接或以 / 开头的站内路径。" },
  )
  .optional();

export const productFieldsSchema = z.object({
  status: z.enum(["live", "beta", "paused"]),
  price: z.string().trim().max(80).optional(),
  url: optionalHttpUrl,
  platform: z.string().trim().max(120).optional(),
  icon: optionalIcon,
});

export const projectFieldsSchema = z.object({
  role: z.string().trim().max(120).optional(),
  period: z.string().trim().max(120).optional(),
  techStack: z
    .array(z.string().trim().min(1).max(60))
    .max(30)
    .default([])
    .transform((items) => [...new Set(items)]),
  repoUrl: optionalHttpUrl,
  url: optionalHttpUrl,
});

export const seoSchema = z.object({
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(320).optional(),
  keywords: z
    .array(z.string().trim().min(1).max(60))
    .max(30)
    .default([])
    .transform((items) => [...new Set(items)]),
  canonicalUrl: optionalHttpUrl,
  ogImageUrl: optionalHttpUrl,
});

export const contentInputSchema = z
  .object({
    type: z.enum(["article", "product", "project"]),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1).max(160),
    excerpt: z.string().trim().max(320).default(""),
    body: z.string().max(1_000_000).default(""),
    coverUrl: optionalHttpUrl,
    tags: z
      .array(z.string().trim().min(1).max(60))
      .max(30)
      .default([])
      .transform((items) => [...new Set(items)]),
    lang: z.string().trim().min(2).max(16).default("zh-CN"),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(10000).default(0),
    product: productFieldsSchema.optional(),
    project: projectFieldsSchema.optional(),
    seo: seoSchema.default({ keywords: [] }),
  })
  .superRefine((value, context) => {
    if (value.type === "product" && !value.product) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product"],
        message: "产品内容需要产品字段。",
      });
    }
    if (value.type === "project" && !value.project) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["project"],
        message: "项目内容需要项目字段。",
      });
    }
  });

export type ContentInput = z.infer<typeof contentInputSchema>;
