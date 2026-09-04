import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="section-kicker">404 · 未找到</p>
      <h1>这页还没有发布。</h1>
      <p>
        <Link className="button button-link" href="/">
          返回首页 <ArrowUpRightIcon />
        </Link>
      </p>
    </main>
  );
}
