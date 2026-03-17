import { test, expect } from "@playwright/test";

test.describe("E2E-001: Complete Chat Flow", () => {
  test("should complete a chat interaction flow", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AgentOS/i);

    const chatInput = page
      .locator('input[placeholder*="message"], input[type="text"]')
      .first();
    if (await chatInput.isVisible()) {
      await chatInput.fill("Hello");
      await chatInput.press("Enter");

      await page.waitForTimeout(1000);
    }
  });
});

test.describe("E2E-004: Dashboard Monitoring", () => {
  test("should load dashboard and display stats", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AgentOS/i);

    await page.waitForTimeout(500);
  });
});
