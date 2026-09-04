type SiteAvatarProps = {
  src?: string;
  alt?: string;
  className?: string;
};

export function SiteAvatar({
  src = "/imgs/avatar.webp",
  alt = "Hecy 的头像",
  className = "",
}: SiteAvatarProps) {
  return (
    <div className={`home-avatar ${className}`.trim()}>
      {/* biome-ignore lint/performance/noImgElement: static export supports local and user-configured remote avatars. */}
      <img src={src} alt={alt} width={96} height={96} />
    </div>
  );
}
