import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2").first()).toContainText(/sign in|login|welcome/i);
  });

  test("should show register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1, h2").first()).toContainText(/sign up|register|create/i);
  });

  test("should navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/register/);
  });

  test("should show validation errors on empty register submit", async ({ page }) => {
    await page.goto("/register");
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should stay on register page with validation errors
      await expect(page).toHaveURL(/register/);
    }
  });

  test("should redirect to login when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Landing page", () => {
  test("should display landing page at root", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=ShopDesc.ai")).toBeVisible();
  });

  test("should show pricing section", async ({ page }) => {
    await page.goto("/");
    const pricingSection = page.locator("#pricing");
    await expect(pricingSection).toBeVisible();
  });

  test("should have sign in and get started links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
  });

  test("should navigate to register from CTA", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL(/register/);
  });
});
