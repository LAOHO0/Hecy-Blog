import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "设置",
};

export default async function SettingsPage() {
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
      <SettingsForm initial={await getSettings()} />
    </div>
  );
}
