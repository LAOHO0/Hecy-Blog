# 参考站迁移说明

目标是保留现有内容的 URL、Slug、日期和排序，同时把内容从仓库文件迁移到 PostgreSQL。

当前仓库已在 packages/content/src/seed.ts 放入一份干净的迁移快照：

- 8 篇文章：包括 imoment-builer、css-scroll-fade-shimmer、env-in-frontend 等。
- 8 条产品/项目展示：包括 imoment、fuck-douyin、codex-reset-monitor 等。
- 所有内容默认使用 zh-CN。
- 产品字段包含状态、平台、价格和链接。
- 项目字段包含角色、周期、技术栈、仓库和项目链接。
- Slug 在同一内容类型内唯一；文章、产品和项目可以使用相同 Slug，避免迁移时无谓改名。
- 内容类型在创建后保持不变；如需转换类型，请新建目标类型内容，再下线原内容。

首次部署时执行 pnpm db:seed。后续可从后台使用 /api/export 导出 JSON，作为定期备份或内容迁移输入。

如果需要从旧仓库自动读取新的 MDX 文件，可在导入脚本中复用 frontmatter 的 title、description、date、updated、tags、hidden 和 lang 字段；发布前请先在后台检查 Slug 冲突。
