import { test, expect } from "@playwright/test";

test("has title and loads landing page", async ({ page }) => {
  // Navigate to baseURL configured in playwright.config.ts
  await page.goto("/");

  // Expect the title to contain "VisaClarity"
  await expect(page).toHaveTitle(/VisaClarity/);

  // Expect the main heading to be visible and contain the intro copy
  const heading = page.locator("h1");
  await expect(heading).toContainText("Stop hoping your");
});
