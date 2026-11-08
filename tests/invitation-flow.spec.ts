import { expect, test, type Page } from "@playwright/test";

// Full flow: staff creates an event, a guest registers through the public
// link, staff sees the registration and exports it. The event is
// deactivated at the end so test data never stays visible to guests.
const email = process.env.E2E_STAFF_EMAIL;
const password = process.env.E2E_STAFF_PASSWORD;

test.describe.configure({ mode: "serial" });
test.skip(!email || !password, "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD not set");

let eventPath = "";
let slug = "";
const title = `[E2E] אירוע בדיקה ${Date.now()}`;
const formSubmit = (page: Page) => page.locator("main form button[type=submit]");

async function signIn(page: Page) {
  await page.goto("/login");
  await page.fill("#email", email!);
  await page.fill("#password", password!);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/admin$/);
}

test("staff creates an event and gets its link", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/events/new");
  await page.fill("#title", title);
  await page.fill("#date_time", "2030-01-01T19:00");
  await page.fill("#venue_name", "אולם הבדיקות");
  await page.fill("#max_guests", "3");
  await formSubmit(page).click();
  await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}$/);
  eventPath = new URL(page.url()).pathname;
  const link = (await page.locator("code").textContent())!.trim();
  slug = link.split("/e/")[1];
  expect(slug).toMatch(/^[a-z2-9]{8}$/);
});

test("guest registers, and the same phone updates instead of duplicating", async ({ page }) => {
  await page.goto(`/e/${slug}`);
  await expect(page.locator("h1")).toHaveText(title);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const submit = page.locator("form:has(#full_name) button[type=submit]");
  await submit.click();
  await expect(page.locator("#full_name-error")).toBeVisible();

  await page.fill("#full_name", "אורח בדיקה");
  await page.fill("#phone", "050-000-1234");
  await page.getByRole("button", { name: "עוד מגיעים" }).click();
  await page.locator("input[name=companions]").fill("מלווה בדיקה");
  await submit.click();
  await expect(page.getByText("תודה, אורח בדיקה!")).toBeVisible();

  await page.getByRole("button", { name: "עדכון ההרשמה" }).click();
  await page.fill("#phone", "+972 50 000 1234");
  await page.getByRole("button", { name: "עוד מגיעים" }).click();
  await submit.click();
  await expect(page.getByText("ההרשמה עודכנה ל-3 מגיעים")).toBeVisible();

  // Capacity is 3 and fully used now.
  await page.reload();
  await expect(page.getByText("האירוע מלא")).toBeVisible();
});

test("staff sees one registration with totals, WhatsApp link and export", async ({ page }) => {
  await signIn(page);
  await page.goto(eventPath);
  const rows = page.locator("main ul > li");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("אורח בדיקה");
  await expect(rows.first()).toContainText("050-000-1234");
  await expect(page.locator("dl > div").filter({ hasText: "מגיעים" }).first().locator("dd")).toHaveText("3 / 3");

  const wa = await rows.first().getByRole("link", { name: "וואטסאפ" }).getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/972500001234\?text=/);

  const res = await page.request.get(`/api/events/${eventPath.split("/").pop()}/export`);
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
});

test("deactivated event disappears for guests", async ({ page }) => {
  await signIn(page);
  await page.goto(`${eventPath}/edit`);
  await page.uncheck("input[name=is_active]");
  await formSubmit(page).click();
  await expect(page.getByText("האירוע לא פעיל")).toBeVisible();
  const res = await page.goto(`/e/${slug}`);
  expect(res?.status()).toBe(404);
});
