import {
  SiAnthropic,
  SiAnthropicHex,
  SiAstro,
  SiAstroHex,
  SiBilibili,
  SiBilibiliHex,
  SiBun,
  SiBunHex,
  SiClaude,
  SiClaudeHex,
  SiCloudflare,
  SiCloudflareHex,
  SiCplusplus,
  SiCplusplusHex,
  SiCursor,
  SiCursorHex,
  SiDart,
  SiDartHex,
  SiDeno,
  SiDenoHex,
  SiDocker,
  SiDockerHex,
  SiElectron,
  SiElectronHex,
  SiFigma,
  SiFigmaHex,
  SiFlutter,
  SiFlutterHex,
  SiGit,
  SiGitHex,
  SiGithub,
  SiGithubHex,
  SiGitlab,
  SiGitlabHex,
  SiGo,
  SiGoHex,
  SiGooglechrome,
  SiGooglechromeHex,
  SiGooglegemini,
  SiGooglegeminiHex,
  SiGraphql,
  SiGraphqlHex,
  SiHuggingface,
  SiHuggingfaceHex,
  SiKotlin,
  SiKotlinHex,
  SiKubernetes,
  SiKubernetesHex,
  SiLangchain,
  SiLangchainHex,
  SiLinux,
  SiLinuxHex,
  SiMarkdown,
  SiMarkdownHex,
  SiMeilisearch,
  SiMeilisearchHex,
  SiMongodb,
  SiMongodbHex,
  SiMysql,
  SiMysqlHex,
  SiNextdotjs,
  SiNginx,
  SiNginxHex,
  SiNodedotjs,
  SiNodedotjsHex,
  SiNotion,
  SiNotionHex,
  SiNpm,
  SiNpmHex,
  SiNuxt,
  SiNuxtHex,
  SiObsidian,
  SiObsidianHex,
  SiOllama,
  SiOllamaHex,
  SiPerplexity,
  SiPerplexityHex,
  SiPhp,
  SiPhpHex,
  SiPnpm,
  SiPnpmHex,
  SiPostgresql,
  SiPostgresqlHex,
  SiPython,
  SiPythonHex,
  SiPytorch,
  SiPytorchHex,
  SiRaycast,
  SiRaycastHex,
  SiReact,
  SiReactHex,
  SiRedis,
  SiRedisHex,
  SiRuby,
  SiRubyHex,
  SiRust,
  SiRustHex,
  SiSupabase,
  SiSupabaseHex,
  SiSvelte,
  SiSvelteHex,
  SiSwift,
  SiSwiftHex,
  SiTailwindcss,
  SiTailwindcssHex,
  SiTampermonkey,
  SiTampermonkeyHex,
  SiTanstack,
  SiTanstackHex,
  SiTauri,
  SiTauriHex,
  SiTiktok,
  SiTiktokHex,
  SiTypescript,
  SiTypescriptHex,
  SiVercel,
  SiVercelHex,
  SiVite,
  SiViteHex,
  SiVitepress,
  SiVitepressHex,
  SiVuedotjs,
  SiVuedotjsHex,
  SiWechat,
  SiWechatHex,
  SiZhihu,
  SiZhihuHex,
} from "@icons-pack/react-simple-icons";
import {
  RiCodeBoxLine,
  RiImageEditLine,
  RiRadarLine,
  RiSearchLine,
  RiShapesLine,
} from "@remixicon/react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

function Icon({
  size = 16,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M7 17 17 7M8 7h9v9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="m14 6-6 6 6 6M8 12h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </Icon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="m6 12 6-6 6 6M12 6v12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m4.5 7.5 7.5 4 7.5-4M12 11.5V21"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Icon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M14 5h5v5M19 5l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </Icon>
  );
}

export function ArticleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M6 3.5h9l3 3V20H6V3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14 3.5V7h4M9 11h6M9 14h6M9 17h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Icon>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <Icon {...props} fill="currentColor" stroke="none">
      <path d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.21.65-.46v-1.67c-2.64.57-3.2-1.12-3.2-1.12-.43-1.1-1.05-1.4-1.05-1.4-.86-.59.06-.58.06-.58.95.07 1.45.98 1.45.98.85 1.45 2.23 1.03 2.78.78.09-.61.33-1.03.61-1.27-2.11-.24-4.33-1.06-4.33-4.7 0-1.04.37-1.89.98-2.56-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.8 0 1.6.11 2.35.35 1.82-1.24 2.62-.98 2.62-.98.52 1.31.19 2.28.09 2.52.61.67.98 1.52.98 2.56 0 3.65-2.23 4.45-4.35 4.69.34.29.65.86.65 1.73v2.58c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2.8v2M12 19.2v2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M2.8 12h2M19.2 12h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M19.5 15.1A7.7 7.7 0 0 1 8.9 4.5 8.2 8.2 0 1 0 19.5 15.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Icon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m8.5 12 2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Icon>
  );
}

/**
 * Official technology marks used by the reference site's skill badges.
 * Keeping the mapping here makes the same visual language available to both
 * the home page and archive/detail pages.
 */
export type BrandName =
  | "Vue"
  | "Vite"
  | "React"
  | "Next.js"
  | "TypeScript"
  | "Bun"
  | "Node.js"
  | "Docker"
  | "Python"
  | "Raycast"
  | "Chrome"
  | "TikTok"
  | "Astro"
  | "Svelte"
  | "Nuxt"
  | "VitePress"
  | "Deno"
  | "Tailwind CSS"
  | "Electron"
  | "Tauri"
  | "Claude"
  | "Anthropic"
  | "Cursor"
  | "Google Gemini"
  | "Perplexity"
  | "Ollama"
  | "Hugging Face"
  | "LangChain"
  | "PyTorch"
  | "Rust"
  | "Go"
  | "Kotlin"
  | "Swift"
  | "Dart"
  | "Flutter"
  | "PHP"
  | "Ruby"
  | "C++"
  | "Git"
  | "GitHub"
  | "GitLab"
  | "Kubernetes"
  | "Vercel"
  | "Cloudflare"
  | "Nginx"
  | "Linux"
  | "npm"
  | "pnpm"
  | "MySQL"
  | "Redis"
  | "MongoDB"
  | "Supabase"
  | "GraphQL"
  | "Figma"
  | "Notion"
  | "Obsidian"
  | "Markdown"
  | "Bilibili"
  | "知乎"
  | "微信";

type BrandIconProps = {
  /** 后台设置里的技能图标名，支持任意字符串，未知名称回退通用图标。 */
  name: BrandName | (string & {});
  size?: number | string;
  color?: string;
  className?: string;
};

export function BrandIcon({
  name,
  size = 16,
  color,
  className,
}: BrandIconProps) {
  const common = {
    "aria-hidden": true,
    className,
    height: size,
    width: size,
  } as const;

  switch (name) {
    case "Vue":
      return <SiVuedotjs {...common} color={color ?? SiVuedotjsHex} />;
    case "Vite":
      return <SiVite {...common} color={color ?? SiViteHex} />;
    case "React":
      return <SiReact {...common} color={color ?? SiReactHex} />;
    case "Next.js":
      return <SiNextdotjs {...common} />;
    case "TypeScript":
      return <SiTypescript {...common} color={color ?? SiTypescriptHex} />;
    case "Bun":
      return <SiBun {...common} color={color ?? SiBunHex} />;
    case "Node.js":
      return <SiNodedotjs {...common} color={color ?? SiNodedotjsHex} />;
    case "Docker":
      return <SiDocker {...common} color={color ?? SiDockerHex} />;
    case "Python":
      return <SiPython {...common} color={color ?? SiPythonHex} />;
    case "Raycast":
      return <SiRaycast {...common} color={color ?? SiRaycastHex} />;
    case "Chrome":
      return <SiGooglechrome {...common} color={color ?? SiGooglechromeHex} />;
    case "TikTok":
      return <SiTiktok {...common} color={color ?? SiTiktokHex} />;
    case "Astro":
      return <SiAstro {...common} color={color ?? SiAstroHex} />;
    case "Svelte":
      return <SiSvelte {...common} color={color ?? SiSvelteHex} />;
    case "Nuxt":
      return <SiNuxt {...common} color={color ?? SiNuxtHex} />;
    case "VitePress":
      return <SiVitepress {...common} color={color ?? SiVitepressHex} />;
    case "Deno":
      return <SiDeno {...common} color={color ?? SiDenoHex} />;
    case "Tailwind CSS":
      return <SiTailwindcss {...common} color={color ?? SiTailwindcssHex} />;
    case "Electron":
      return <SiElectron {...common} color={color ?? SiElectronHex} />;
    case "Tauri":
      return <SiTauri {...common} color={color ?? SiTauriHex} />;
    case "Claude":
      return <SiClaude {...common} color={color ?? SiClaudeHex} />;
    case "Anthropic":
      return <SiAnthropic {...common} color={color ?? SiAnthropicHex} />;
    case "Cursor":
      return <SiCursor {...common} color={color ?? SiCursorHex} />;
    case "Google Gemini":
      return <SiGooglegemini {...common} color={color ?? SiGooglegeminiHex} />;
    case "Perplexity":
      return <SiPerplexity {...common} color={color ?? SiPerplexityHex} />;
    case "Ollama":
      return <SiOllama {...common} color={color ?? SiOllamaHex} />;
    case "Hugging Face":
      return <SiHuggingface {...common} color={color ?? SiHuggingfaceHex} />;
    case "LangChain":
      return <SiLangchain {...common} color={color ?? SiLangchainHex} />;
    case "PyTorch":
      return <SiPytorch {...common} color={color ?? SiPytorchHex} />;
    case "Rust":
      return <SiRust {...common} color={color ?? SiRustHex} />;
    case "Go":
      return <SiGo {...common} color={color ?? SiGoHex} />;
    case "Kotlin":
      return <SiKotlin {...common} color={color ?? SiKotlinHex} />;
    case "Swift":
      return <SiSwift {...common} color={color ?? SiSwiftHex} />;
    case "Dart":
      return <SiDart {...common} color={color ?? SiDartHex} />;
    case "Flutter":
      return <SiFlutter {...common} color={color ?? SiFlutterHex} />;
    case "PHP":
      return <SiPhp {...common} color={color ?? SiPhpHex} />;
    case "Ruby":
      return <SiRuby {...common} color={color ?? SiRubyHex} />;
    case "C++":
      return <SiCplusplus {...common} color={color ?? SiCplusplusHex} />;
    case "Git":
      return <SiGit {...common} color={color ?? SiGitHex} />;
    case "GitHub":
      return <SiGithub {...common} color={color ?? SiGithubHex} />;
    case "GitLab":
      return <SiGitlab {...common} color={color ?? SiGitlabHex} />;
    case "Kubernetes":
      return <SiKubernetes {...common} color={color ?? SiKubernetesHex} />;
    case "Vercel":
      return <SiVercel {...common} color={color ?? SiVercelHex} />;
    case "Cloudflare":
      return <SiCloudflare {...common} color={color ?? SiCloudflareHex} />;
    case "Nginx":
      return <SiNginx {...common} color={color ?? SiNginxHex} />;
    case "Linux":
      return <SiLinux {...common} color={color ?? SiLinuxHex} />;
    case "npm":
      return <SiNpm {...common} color={color ?? SiNpmHex} />;
    case "pnpm":
      return <SiPnpm {...common} color={color ?? SiPnpmHex} />;
    case "MySQL":
      return <SiMysql {...common} color={color ?? SiMysqlHex} />;
    case "Redis":
      return <SiRedis {...common} color={color ?? SiRedisHex} />;
    case "MongoDB":
      return <SiMongodb {...common} color={color ?? SiMongodbHex} />;
    case "Supabase":
      return <SiSupabase {...common} color={color ?? SiSupabaseHex} />;
    case "GraphQL":
      return <SiGraphql {...common} color={color ?? SiGraphqlHex} />;
    case "Figma":
      return <SiFigma {...common} color={color ?? SiFigmaHex} />;
    case "Notion":
      return <SiNotion {...common} color={color ?? SiNotionHex} />;
    case "Obsidian":
      return <SiObsidian {...common} color={color ?? SiObsidianHex} />;
    case "Markdown":
      return <SiMarkdown {...common} color={color ?? SiMarkdownHex} />;
    case "Bilibili":
      return <SiBilibili {...common} color={color ?? SiBilibiliHex} />;
    case "知乎":
      return <SiZhihu {...common} color={color ?? SiZhihuHex} />;
    case "微信":
      return <SiWechat {...common} color={color ?? SiWechatHex} />;
  }
  return <RiCodeBoxLine {...common} />;
}

export type ProductIconName =
  | "imoment"
  | "fuck-douyin"
  | "codex-reset-monitor"
  | "doubao-nomark"
  | "find-your-repo"
  | "sf-symbols"
  | "can-i-chat"
  | "project";

type ProductIconProps = {
  name: ProductIconName;
  size?: number | string;
  color?: string;
  className?: string;
};

/** Product/project marks used in cards. All marks are vector icons, never emoji. */
export function ProductBrandIcon({
  name,
  size = 17,
  color,
  className,
}: ProductIconProps) {
  const common = {
    "aria-hidden": true,
    className,
    height: size,
    width: size,
  } as const;

  switch (name) {
    case "imoment":
      return <RiSearchLine {...common} color={color ?? "#1a73e8"} />;
    case "fuck-douyin":
      return <SiTiktok {...common} color={color ?? SiTiktokHex} />;
    case "codex-reset-monitor":
      return <RiRadarLine {...common} color={color ?? "#00a884"} />;
    case "doubao-nomark":
      return <RiImageEditLine {...common} color={color ?? "#0ea5e9"} />;
    case "find-your-repo":
      return <SiRaycast {...common} color={color ?? SiRaycastHex} />;
    case "sf-symbols":
      return <RiShapesLine {...common} color={color ?? "#c026d3"} />;
    case "can-i-chat":
      return <SiGooglechrome {...common} color={color ?? SiGooglechromeHex} />;
    case "project":
      return <RiShapesLine {...common} color={color} />;
  }
}

export function ProductIconForSlug({
  slug,
  ...props
}: Omit<ProductIconProps, "name"> & { slug?: string }) {
  const known: ProductIconName[] = [
    "imoment",
    "fuck-douyin",
    "codex-reset-monitor",
    "doubao-nomark",
    "find-your-repo",
    "sf-symbols",
    "can-i-chat",
  ];
  const name = known.includes(slug as ProductIconName)
    ? (slug as ProductIconName)
    : "project";
  return <ProductBrandIcon name={name} {...props} />;
}

type TechBadgeIconProps = {
  name: string;
  size?: number | string;
  className?: string;
};

/** Small vector marks for the technology badges shown on archive cards. */
export function TechBadgeIcon({
  name,
  size = 14,
  className,
}: TechBadgeIconProps) {
  const common = {
    "aria-hidden": true,
    className,
    height: size,
    width: size,
  } as const;

  switch (name) {
    case "Git":
      return <SiGit {...common} color={SiGitHex} />;
    case "Chrome API":
      return <SiGooglechrome {...common} color={SiGooglechromeHex} />;
    case "Douyin":
      return <SiTiktok {...common} color={SiTiktokHex} />;
    case "Tampermonkey":
      return <SiTampermonkey {...common} color={SiTampermonkeyHex} />;
    case "Meilisearch":
      return <SiMeilisearch {...common} color={SiMeilisearchHex} />;
    case "PostgreSQL":
      return <SiPostgresql {...common} color={SiPostgresqlHex} />;
    case "Raycast":
      return <SiRaycast {...common} color={SiRaycastHex} />;
    case "React":
      return <SiReact {...common} color={SiReactHex} />;
    case "TanStack Start":
      return <SiTanstack {...common} color={SiTanstackHex} />;
    case "Tailwind CSS":
      return <SiTailwindcss {...common} color={SiTailwindcssHex} />;
    case "TypeScript":
      return <SiTypescript {...common} color={SiTypescriptHex} />;
    case "Next.js":
      return <SiNextdotjs {...common} />;
    case "Vite":
      return <SiVite {...common} color={SiViteHex} />;
    default:
      return <RiShapesLine {...common} />;
  }
}
