import { describe, expect, it } from "vitest";
import { roleHasPermission } from "../src/lib/rbac";
import { planHasCapacity } from "../src/lib/limits";
import { workspaceSlugFromHost } from "../src/lib/tenant-host";
import { loginSchema, registerSchema } from "../src/lib/validation";

describe("role permissions", () => {
  it("gives owners full workspace control", () => {
    expect(roleHasPermission("OWNER", "MANAGE_BILLING")).toBe(true);
    expect(roleHasPermission("OWNER", "DELETE_ANY_MESSAGE")).toBe(true);
  });
  it("keeps billing and ownership privileges out of admin/member roles", () => {
    expect(roleHasPermission("ADMIN", "MANAGE_BILLING")).toBe(false);
    expect(roleHasPermission("MEMBER", "DELETE_ANY_MESSAGE")).toBe(false);
    expect(roleHasPermission("MEMBER", "SEND_MESSAGE")).toBe(true);
  });
  it("makes guests read-only", () => {
    expect(roleHasPermission("GUEST", "VIEW_WORKSPACE")).toBe(true);
    expect(roleHasPermission("GUEST", "SEND_MESSAGE")).toBe(false);
  });
});
describe("plan limits", () => {
  it("accepts actions up to but not beyond the configured plan cap", () => {
    expect(planHasCapacity("FREE", "members", 9)).toBe(true);
    expect(planHasCapacity("FREE", "members", 10)).toBe(false);
    expect(planHasCapacity("PRO", "channels", 99)).toBe(true);
    expect(planHasCapacity("BUSINESS", "channels", 1000)).toBe(false);
  });
});
describe("workspace subdomain resolution", () => {
  it("normalizes an application subdomain", () => {
    expect(workspaceSlugFromHost("Acme.synchq.app:443")).toBe("acme");
  });
  it("does not treat reserved or unrelated hosts as workspaces", () => {
    expect(workspaceSlugFromHost("www.synchq.app")).toBeNull();
    expect(workspaceSlugFromHost("localhost:3000")).toBeNull();
    expect(workspaceSlugFromHost("evil.example.com")).toBeNull();
    expect(workspaceSlugFromHost("foo.bar.synchq.app")).toBeNull();
  });
});
describe("request validation", () => {
  it("normalizes login emails", () => {
    expect(
      loginSchema.parse({ email: "TEAM@Example.com", password: "a" }).email,
    ).toBe("team@example.com");
  });
  it("rejects short passwords and malformed email", () => {
    expect(
      registerSchema.safeParse({
        name: "Team",
        email: "nope",
        password: "short",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "Team",
        email: "team@example.com",
        password: "1234567890",
      }).success,
    ).toBe(true);
  });
});
