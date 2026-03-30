import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test.describe("Login Page", () => {
    test("should show login form", async ({ page }) => {
      await page.goto("/login");

      await expect(
        page.locator("text=Sign in to your account")
      ).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(
        page.locator("button", { hasText: "Sign in" })
      ).toBeVisible();
      await expect(
        page.locator("text=Continue with Google")
      ).toBeVisible();
    });

    test("should show validation errors for empty form", async ({ page }) => {
      await page.goto("/login");

      await page.click("button:has-text('Sign in')");

      // Zod validation should show error messages
      await expect(page.locator("text=Enter a valid email")).toBeVisible();
      await expect(page.locator("text=Password is required")).toBeVisible();
    });

    test("should have link to register page", async ({ page }) => {
      await page.goto("/login");

      await page.click("text=Sign up");
      await expect(page).toHaveURL("/register");
    });

    test("should have link to forgot password page", async ({ page }) => {
      await page.goto("/login");

      await page.click("text=Forgot password?");
      await expect(page).toHaveURL("/forgot-password");
    });
  });

  test.describe("Register Page", () => {
    test("should show register form", async ({ page }) => {
      await page.goto("/register");

      await expect(page.locator("text=Create an account")).toBeVisible();
      await expect(page.locator("#name")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#confirmPassword")).toBeVisible();
      await expect(
        page.locator("button", { hasText: "Create account" })
      ).toBeVisible();
    });

    test("should show validation for short password", async ({ page }) => {
      await page.goto("/register");

      await page.fill("#name", "Test User");
      await page.fill("#email", "test@example.com");
      await page.fill("#password", "short");
      await page.fill("#confirmPassword", "short");

      await page.click("button:has-text('Create account')");

      await expect(
        page.locator("text=Password must be at least 8 characters")
      ).toBeVisible();
    });

    test("should show mismatch error for different passwords", async ({
      page,
    }) => {
      await page.goto("/register");

      await page.fill("#name", "Test User");
      await page.fill("#email", "test@example.com");
      await page.fill("#password", "password123");
      await page.fill("#confirmPassword", "password456");

      await page.click("button:has-text('Create account')");

      await expect(
        page.locator("text=Passwords do not match")
      ).toBeVisible();
    });

    test("should have link to login page", async ({ page }) => {
      await page.goto("/register");

      await page.click("text=Sign in");
      await expect(page).toHaveURL("/login");
    });
  });
});
