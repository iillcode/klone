import { isAdminPath } from "@/lib/route-protection";

describe("isAdminPath", () => {
  it("protects /dashboard", () => {
    expect(isAdminPath("/dashboard")).toBe(true);
  });

  it("protects nested dashboard routes", () => {
    expect(isAdminPath("/dashboard/settings")).toBe(true);
  });

  it("does not protect the login page", () => {
    expect(isAdminPath("/login")).toBe(false);
  });

  it("does not protect arbitrary paths", () => {
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/foo")).toBe(false);
  });
});
