import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should show hero section and nav", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=ShopDesc.ai")).toBeVisible();
    await expect(
      page.locator("h1", { hasText: "AI Product Descriptions That" })
    ).toBeVisible();
    await expect(
      page.locator("text=Start free — 5 generations/mo")
    ).toBeVisible();
  });

  test("should show feature cards", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=AI-Powered Descriptions")).toBeVisible();
    await expect(page.locator("text=SEO Scoring & Analytics")).toBeVisible();
    await expect(page.locator("text=Bulk Generation")).toBeVisible();
    await expect(page.locator("text=Platform-Ready Formatting")).toBeVisible();
  });

  test("should navigate to login", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Sign in");
    await expect(page).toHaveURL("/login");
    await expect(
      page.locator("text=Sign in to your account")
    ).toBeVisible();
  });

  test("should navigate to register", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Get started >> nth=0");
    await expect(page).toHaveURL("/register");
    await expect(page.locator("text=Create an account")).toBeVisible();
  });
});
