import { expect, test } from "@playwright/test";
import { OWNER, STAFF, futureDate, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test("owner quotes, records acceptance and explicitly confirms a booking", async ({ page }) => {
  // Create a fresh request as a visitor.
  const email = `owner-flow-${Date.now()}@example.com`;
  await page.goto("/request-quote?service=DAY_HIRE");
  await page.waitForLoadState("networkidle");
  await page.fill("#startDate", futureDate(60));
  await page.fill("#fullName", "Owner Flow Guest");
  await page.fill("#email", email);
  await page.fill("#phone", "+44 7700 900456");
  await page.check("input[name=consent]");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page).toHaveURL(/request-received/);
  const ref = new URL(page.url()).searchParams.get("ref")!;

  await signIn(page, OWNER);
  await page.goto(`/admin/bookings?q=${ref}`);
  await page.getByRole("link", { name: ref }).click();

  await page.getByRole("button", { name: "Create quotation" }).click();
  await page.fill("input[aria-label='Line 1 description']", "Car with driver, full day");
  await page.fill("input[aria-label='Line 1 unit price']", "18500");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText(/Draft saved\. Total/)).toBeVisible();
  await page.getByRole("button", { name: "Mark as sent" }).click();
  await expect(page.getByText("Customer response")).toBeVisible();
  await page.getByRole("button", { name: "Customer accepted" }).click();
  await expect(page.getByText("Accepted by the customer")).toBeVisible();

  await page.getByRole("link", { name: /Booking LVT-/ }).click();
  await page.getByText("Confirm booking", { exact: true }).first().click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText(/availability has been checked/)).toBeVisible();
  await page.getByText("Confirm booking", { exact: true }).first().click();
  await page.check("input[name=availabilityChecked]");
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText("Status updated to Confirmed.")).toBeVisible();
});

test("staff cannot open admin-only areas", async ({ page }) => {
  test.skip(!STAFF.password, "Set E2E_STAFF_PASSWORD to run");
  await signIn(page, STAFF);
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/denied=1/);
  await page.goto("/admin/team");
  await expect(page).toHaveURL(/denied=1/);
});
