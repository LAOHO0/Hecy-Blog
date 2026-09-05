import { defaultSettings } from "@hecy/content/seed";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "设置",
};

export default async function SettingsPage() {
  // 读取失败（如数据库未初始化）时回退默认值并展示原因，
  // 避免整个设置页白屏，用户能看到具体错误再对症处理。
  let initial = defaultSettings;
  let warning = "";
  try {
    initial = await getSettings();
  } catch (error) {
    warning =
      error instanceof Error
        ? error.message
        : "读取设置失败，请检查数据库连接。";
    console.error("[admin] 读取设置失败：", error);
  }

  return (
    <div className="page-content">
      <section className="page-intro">
        <div>
          <div className="eyebrow">站点配置</div>
          <h1 className="page-title">设置</h1>
          <p className="page-subtitle">
            管理基础信息、首页“关于我 / 技能 /
            最近动态”版块、导航、社交链接和页脚，保存后自动触发前台构建。
          </p>
        </div>
      </section>
      {warning ? (
        <p className="settings-warning">
          设置读取失败，当前显示默认值（保存前请先解决）：{warning}
        </p>
      ) : null}
      <SettingsForm initial={initial} />
    </div>
  );
}
