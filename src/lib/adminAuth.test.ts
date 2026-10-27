import { afterEach, describe, expect, it, vi } from "vitest";
import { adminConfigured, isAdminKeyValid } from "./adminAuth";

afterEach(() => vi.unstubAllEnvs());

describe("adminAuth", () => {
  it("sin ADMIN_PASSWORD nada es válido", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(adminConfigured()).toBe(false);
    expect(isAdminKeyValid("")).toBe(false);
    expect(isAdminKeyValid("cualquiera")).toBe(false);
  });

  it("solo acepta la clave exacta", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secreta-123");
    expect(adminConfigured()).toBe(true);
    expect(isAdminKeyValid("secreta-123")).toBe(true);
    expect(isAdminKeyValid("secreta-124")).toBe(false);
    expect(isAdminKeyValid("secreta-1234")).toBe(false);
    expect(isAdminKeyValid(null)).toBe(false);
  });
});
