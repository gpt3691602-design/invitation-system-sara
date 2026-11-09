import { expect, test, type Page } from "@playwright/test";

// "What's my table?" on the invitation page, on the event day. The event is
// created for today (Israel time) so the lookup window is open, then
// deactivated at the end.
const email = process.env.E2E_STAFF_EMAIL;
const password = process.env.E2E_STAFF_PASSWORD;

test.describe.configure({ mode: "serial" });
test.skip(!email || !password, "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD not set");

let eventPath = "";
let slug = "";
const todayInIsrael = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

async function signIn(page: Page) {
  await page.goto("/login");
  await page.fill("#email", email!);
  await page.fill("#password", password!);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/admin$/);
}

async function register(page: Page, name: string, phone: string, extra: number) {
  await page.goto(`/e/${slug}`);
  await page.fill("#full_name", name);
  await page.fill("#phone", phone);
  for (let i = 0; i < extra; i++) await page.getByRole("button", { name: "עוד מגיעים" }).click();
  await page.locator("form:has(#full_name) button[type=submit]").click();
  await expect(page.getByText(`תודה, ${name}!`)).toBeVisible();
}

test("set up today's event, guests and one seated party", async ({ page, browser }) => {
  await signIn(page);
  await page.goto("/admin/events/new");
  await page.fill("#title", `[E2E] שולחן שלי ${Date.now()}`);
  await page.fill("#date_time", `${todayInIsrael}T23:59`);
  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}$/);
  eventPath = new URL(page.url()).pathname;
  slug = (await page.locator("code").textContent())!.trim().split("/e/")[1];

  const guest = await (await browser.newContext({ locale: "he-IL" })).newPage();
  // No tables yet: the lookup card is not shown.
  await guest.goto(`/e/${slug}`);
  await expect(guest.getByRole("heading", { name: /מה השולחן שלי/ })).toHaveCount(0);
  await register(guest, "משפחת שולחן", "050-200-3001", 2);
  await register(guest, "אורח בלי שולחן", "050-200-3002", 0);

  await page.goto(`${eventPath}/tables`);
  await page.getByLabel("כמה שולחנות להוסיף").fill("1");
  await page.getByRole("button", { name: "הוספת שולחנות" }).click();
  await page.getByLabel("שולחן עבור משפחת שולחן").selectOption({ label: "שולחן 1" });
  await expect(page.getByRole("status").filter({ hasText: "שומר" })).toHaveCount(0);
  await expect(page.locator("li").filter({ has: page.getByRole("heading", { name: "שולחן 1", exact: true }) })).toContainText("3 מתוך 10");
});

test("a guest finds their table by phone, in any format", async ({ page }) => {
  await page.goto(`/e/${slug}`);
  const card = page.locator("section").filter({ has: page.getByRole("heading", { name: /מה השולחן שלי/ }) });
  await expect(card).toBeVisible();
  // It sits at the bottom of the invitation, below the RSVP form.
  const formBottom = await page.locator("form:has(#full_name)").evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
  const cardTop = await card.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(cardTop).toBeGreaterThan(formBottom);

  const lookup = async (phone: string) => {
    await card.getByLabel("מספר טלפון").fill(phone);
    await card.getByRole("button", { name: "מצאו את השולחן שלי" }).click();
  };

  await lookup("123");
  await expect(card.getByRole("alert")).toContainText("לא תקין");

  await lookup("+972 50 200 3001");
  await expect(card).toContainText("שולחן 1");
  await expect(card).toContainText("3 מקומות שמורים לכם");
  // No registrant name is revealed.
  await expect(card).not.toContainText("משפחת שולחן");

  await card.getByRole("button", { name: "חיפוש מספר אחר" }).click();
  await lookup("0502003002");
  await expect(card.getByRole("alert")).toContainText("עדיין לא שובצתם");

  await lookup("050-999-9999");
  await expect(card.getByRole("alert")).toContainText("לא מצאנו הרשמה");
});

test("clean up: deactivate the event", async ({ page }) => {
  await signIn(page);
  await page.goto(`${eventPath}/edit`);
  await page.uncheck("input[name=is_active]");
  await page.locator("main form button[type=submit]").click();
  await expect(page.getByText("האירוע לא פעיל")).toBeVisible();
});
