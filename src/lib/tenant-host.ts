const RESERVED = new Set(["www", "app", "api", "auth", "localhost"]);
export function workspaceSlugFromHost(input: string) {
  const host = input.toLowerCase().split(":")[0].replace(/\.$/, "");
  const suffix = ".synchq.app";
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!slug || slug.includes(".") || RESERVED.has(slug)) return null;
  return slug;
}
