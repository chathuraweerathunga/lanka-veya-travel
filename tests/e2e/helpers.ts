import { expect, type Page } from "@playwright/test";

export const OWNER = { email: process.env.E2E_OWNER_EMAIL ?? "owner@lankaveya.test", password: process.env.E2E_OWNER_PASSWORD ?? "" };
export const STAFF = { email: process.env.E2E_STAFF_EMAIL ?? "staff@lankaveya.test", password: process.env.E2E_STAFF_PASSWORD ?? "" };

export function futureDate(days: number) {
  return new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
}

export async function signIn(page: Page, who: { email: string; password: string }) {
  if (!who.password) throw new Error("Set E2E_OWNER_PASSWORD / E2E_STAFF_PASSWORD");
  await page.goto("/admin/login");
  await page.fill("input[name=email]", who.email);
  await page.fill("input[name=password]", who.password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/admin$/);
}
