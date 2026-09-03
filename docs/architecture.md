# Hecy Blog 架构说明

## 两个运行时

- apps/site：静态导出。构建时从 CONTENT_API_URL 读取已发布内容；开发环境或显式设置 ALLOW_SEED_FALLBACK=true 时才使用仓库中的迁移快照，生产 API 配置缺失或不可用会让构建失败。
- apps/admin：服务端 Next.js。负责认证、内容编辑、私有预览、版本、媒体和构建队列。

## 数据模型

packages/content/src/schema.ts 定义 PostgreSQL 表：

- content：公共字段、Markdown / MDX 安全子集正文和产品/项目 JSON 字段。
- content_versions：每次保存、发布、撤回前的快照。
- build_jobs：静态构建队列与结果。
- media_assets：S3 对象引用。
- site_settings：站点配置。
- slug_redirects：Slug 变更后的旧地址重定向。

`content.id` 与版本表使用 PostgreSQL UUID；迁移种子采用稳定 UUID。内容类型在创建后保持不变，避免文章、产品和项目之间的公开路径发生歧义。Slug 在同一内容类型内唯一（文章、产品、项目可以各自使用相同 Slug），只负责公开 URL。重复改名时会合并重定向链；后台公开 API 和静态构建会为旧地址生成兼容跳转页。

## 安全边界

- 单管理员用户名 + 密码，不开放注册。
- 生产环境必须使用 ADMIN_PASSWORD_HASH（bcrypt）和随机 AUTH_SECRET。
- 会话使用 HttpOnly Cookie，登录接口按 IP 限流。
- 私有预览链接带过期时间，并设置 noindex。
- 构建回调使用 BUILD_WEBHOOK_SECRET。
