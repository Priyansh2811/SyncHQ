export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "team"
  );
}
export async function uniqueWorkspaceSlug(value: string) {
  const { randomBytes } = await import("node:crypto");
  return `${slugify(value).slice(0, 41)}-${randomBytes(4).toString("hex")}`;
}
