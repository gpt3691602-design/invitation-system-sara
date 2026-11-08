import { expect, test } from "@playwright/test";

test("health check reports a working database connection", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ ok: true, supabase: "connected" });
});

test("unknown invitation link shows a friendly 404", async ({ page }) => {
  const res = await page.goto("/e/doesnotexist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("ההזמנה לא נמצאה")).toBeVisible();
});

test("admin area and export require a staff login", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  const res = await request.get("/api/events/00000000-0000-0000-0000-000000000000/export");
  expect(res.status()).toBe(401);
});
