/**
 * 客户端列表项 key 生成。
 * crypto.randomUUID 只在安全上下文（HTTPS / localhost）可用，
 * 通过 HTTP + 公网 IP 访问后台时该方法不存在，会导致设置页崩溃；
 * 这里按能力降级：randomUUID → getRandomValues → 时间戳 + 随机串。
 */
export function createClientKey(): string {
  const cryptoRef = globalThis.crypto;
  if (typeof cryptoRef?.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  if (typeof cryptoRef?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoRef.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
