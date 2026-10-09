import { expect, test } from "@playwright/test";
import { futureDate } from "./helpers";

const PAGES = ["/", "/tours", "/destinations", "/transport", "/airport-transfers", "/private-driver", "/vehicles", "/plan-my-trip", "/request-quote", "/contact", "/faq", "/about", "/privacy-policy", "/terms-and-conditions", "/cancellation-policy"];

test("every public page renders with a unique title and one h1", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of PAGES) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1"), path).toHaveCount(1);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(PAGES.length);
});

test("homepage explains the offer above the fold and links WhatsApp to the business number", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Discover Sri Lanka");
  await expect(page.getByRole("link", { name: /Plan your journey/ }).first()).toBeVisible();
  const wa = await page.locator("a[href^='https://wa.me/']").first().getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/94776205149/);
});

test("navigation works on this viewport", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#mobile-menu").getByRole("link", { name: "Destinations" }).click();
  } else {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Destinations" }).click();
  }
  await expect(page).toHaveURL(/\/destinations$/);
});

test("booking request validates, saves and says the trip is not confirmed", async ({ page }) => {
  await page.goto("/request-quote?service=AIRPORT_TRANSFER");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await page.fill("#pickupLocation", "Bandaranaike International Airport");
  await page.fill("#dropoffLocation", "Galle Fort");
  await page.fill("#startDate", futureDate(45));
  await page.fill("#fullName", "Playwright Traveller");
  await page.fill("#email", `pw-${Date.now()}@example.com`);
  await page.fill("#phone", "+61 412 345 678");
  await page.check("input[name=consent]");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page).toHaveURL(/\/request-received\?ref=LVT-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
  await expect(page.getByText("Your trip is not confirmed yet.")).toBeVisible();
});

test("admin pages are not reachable or indexable without signing in", async ({ page, request }) => {
  await page.goto("/admin/bookings");
  await expect(page).toHaveURL(/\/admin\/login/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/(admin)?/);
  const exportRes = await request.get("/api/admin/export/bookings", { maxRedirects: 0 });
  expect([302, 307, 401]).toContain(exportRes.status());
});
