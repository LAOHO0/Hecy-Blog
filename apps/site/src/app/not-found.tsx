import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="eyebrow">404 · 未找到</div>
      <h1>这页还没有发布。</h1>
      <p>
        <Link className="hero-link" href="/">
          返回首页 →
        </Link>
      </p>
    </main>
  );
}
