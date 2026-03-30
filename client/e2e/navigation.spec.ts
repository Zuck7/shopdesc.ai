import { test, expect } from "@playwright/test";

test.describe("Protected Routes", () => {
  test("should redirect /dashboard to landing when not logged in", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // ProtectedRoute should redirect unauthenticated users
    await expect(page).not.toHaveURL("/dashboard");
  });

  test("should redirect /products to landing when not logged in", async ({
    page,
  }) => {
    await page.goto("/products");

    await expect(page).not.toHaveURL("/products");
  });

  test("should redirect /generate to landing when not logged in", async ({
    page,
  }) => {
    await page.goto("/generate");

    await expect(page).not.toHaveURL("/generate");
  });

  test("should redirect /analytics to landing when not logged in", async ({
    page,
  }) => {
    await page.goto("/analytics");

    await expect(page).not.toHaveURL("/analytics");
  });
});

test.describe("Navigation", () => {
  test("unknown routes should redirect to landing", async ({ page }) => {
    await page.goto("/some-nonexistent-route");

    await expect(page).toHaveURL("/");
  });
});
