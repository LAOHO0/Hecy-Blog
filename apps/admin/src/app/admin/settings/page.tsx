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
            管理首页标题、简介、导航、社交链接和页脚信息。
          </p>
        </div>
      </section>
      <SettingsForm initial={await getSettings()} />
    </div>
  );
}
