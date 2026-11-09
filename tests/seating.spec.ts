import ExcelJS from "exceljs";
import { expect, test, type Page } from "@playwright/test";

// Staff seats guests at tables: by the per-guest picker (works on touch),
// by drag and drop (desktop), with an over-capacity warning, and the table
// shows up in the Excel export. The event is deactivated at the end.
const email = process.env.E2E_STAFF_EMAIL;
const password = process.env.E2E_STAFF_PASSWORD;

test.describe.configure({ mode: "serial" });
test.skip(!email || !password, "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD not set");

let eventPath = "";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.fill("#email", email!);
  await page.fill("#password", password!);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/admin$/);
}

async function addRegistration(page: Page, name: string, phone: string, count: number) {
  await page.goto(`${eventPath}/registrations/new`);
  await page.fill("#full_name", name);
  await page.fill("#phone", phone);
  await page.fill("#guest_count", String(count));
  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL(new RegExp(`${eventPath}$`));
}

// The board updates before the save completes; wait for "saving" to clear.
const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "שומר" })).toHaveCount(0);

const tableCard = (page: Page, name: string) => page.locator("li").filter({ has: page.getByRole("heading", { name, exact: true }) });

test("set up an event with two parties", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/events/new");
  await page.fill("#title", `[E2E] שולחנות ${Date.now()}`);
  await page.fill("#date_time", "2030-02-01T19:00");
  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}$/);
  eventPath = new URL(page.url()).pathname;
  await addRegistration(page, "משפחת כהן", "050-100-0001", 2);
  await addRegistration(page, "משפחת לוי", "050-100-0002", 3);
});

test("create tables and seat guests", async ({ page }) => {
  await signIn(page);
  await page.goto(eventPath);
  await page.getByRole("link", { name: "סידור שולחנות" }).click();
  await expect(page.getByRole("heading", { name: "סידור שולחנות" })).toBeVisible();
  await expect(page.getByText("עדיין אין שולחנות")).toBeVisible();

  // The screen asks how many tables the hall has, and recommends a number.
  await expect(page.getByRole("heading", { name: "כמה שולחנות יש באולם?" })).toBeVisible();
  await page.getByLabel("מספר השולחנות באולם").fill("2");
  await page.getByLabel("מקומות בכל שולחן").fill("3");
  await expect(page.getByText("לפי 5 מגיעים מאושרים, מומלץ לפחות 2 שולחנות של 3")).toBeVisible();
  await page.getByRole("button", { name: "סידור האולם" }).click();
  await expect(tableCard(page, "שולחן 1")).toBeVisible();
  await expect(tableCard(page, "שולחן 2")).toBeVisible();

  // Seat by the picker (the touch-friendly path).
  await page.getByLabel("שולחן עבור משפחת כהן").selectOption({ label: "שולחן 1" });
  await expect(tableCard(page, "שולחן 1")).toContainText("2 מתוך 3 מקומות");

  // Over capacity is flagged, not blocked.
  await page.getByLabel("שולחן עבור משפחת לוי").selectOption({ label: "שולחן 1" });
  await expect(tableCard(page, "שולחן 1")).toContainText("5 מתוך 3 מקומות");
  await expect(tableCard(page, "שולחן 1")).toContainText("חריגה!");

  // Survives a reload (saved, not just optimistic).
  await saved(page);
  await page.reload();
  await expect(tableCard(page, "שולחן 1")).toContainText("5 מתוך 3 מקומות");

  // Move by picker to the other table, then unseat.
  await page.getByLabel("שולחן עבור משפחת לוי").selectOption({ label: "שולחן 2" });
  await expect(tableCard(page, "שולחן 2")).toContainText("3 מתוך 3 מקומות");
  await expect(tableCard(page, "שולחן 1")).not.toContainText("חריגה!");
  await page.getByLabel("שולחן עבור משפחת לוי").selectOption({ label: "לא משובץ" });
  await expect(page.getByText("לא משובצים (1)")).toBeVisible();
  await saved(page);
});

test("before the event day the invitation shows the table card, not yet usable", async ({ page }) => {
  await signIn(page);
  await page.goto(eventPath);
  const slug = (await page.locator("code").textContent())!.trim().split("/e/")[1];
  await page.goto(`/e/${slug}`);
  const card = page.locator("section").filter({ has: page.getByRole("heading", { name: /מה השולחן שלי/ }) });
  await expect(card).toContainText("ביום האירוע תוכלו למצוא כאן את השולחן שלכם");
  await expect(card.getByLabel("מספר טלפון")).toHaveCount(0);
});

test("drag and drop seats a guest (desktop)", async ({ page, isMobile }) => {
  test.skip(isMobile, "drag and drop is a desktop gesture; the picker covers touch");
  await signIn(page);
  await page.goto(`${eventPath}/tables`);
  const card = page.locator("li[draggable=true]").filter({ hasText: "משפחת לוי" });
  // Grab the card by the name, the way a person would (not by its picker).
  await card.getByText("משפחת לוי", { exact: true }).dragTo(tableCard(page, "שולחן 2"));
  await expect(tableCard(page, "שולחן 2")).toContainText("משפחת לוי");
  await expect(page.getByText("כולם משובצים")).toBeVisible();
  await saved(page);
});

test("table shows in the registrations list and the Excel export", async ({ page, isMobile }) => {
  await signIn(page);
  if (isMobile) {
    await page.goto(`${eventPath}/tables`);
    await page.getByLabel("שולחן עבור משפחת לוי").selectOption({ label: "שולחן 2" });
    await expect(tableCard(page, "שולחן 2")).toContainText("משפחת לוי");
    await saved(page);
  }
  await page.goto(eventPath);
  await expect(page.locator("main ul > li").filter({ hasText: "משפחת כהן" })).toContainText("שולחן 1");

  const res = await page.request.get(`/api/events/${eventPath.split("/").pop()}/export`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(await res.body()) as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  const header = (ws.getRow(1).values as unknown[]).slice(1);
  const tableCol = header.indexOf("שולחן") + 1;
  expect(tableCol).toBeGreaterThan(0);
  const cohen = ws.getRows(2, ws.rowCount - 1)!.find((r) => r.getCell(1).value === "משפחת כהן");
  expect(cohen?.getCell(tableCol).value).toBe("שולחן 1");
});

test("hall size: grow, then shrink with a warning about seated guests", async ({ page }) => {
  await signIn(page);
  await page.goto(`${eventPath}/tables`);
  // Grow 2 → 4
  await page.getByLabel("מספר השולחנות באולם").fill("4");
  await page.getByRole("button", { name: "עדכון מספר השולחנות" }).click();
  await expect(tableCard(page, "שולחן 4")).toBeVisible();
  await expect(page.getByText("כרגע: 4 שולחנות, 12 מקומות")).toBeVisible();

  // Shrink 4 → 1: tables 2–4 go; Levi (at table 2) returns to not seated.
  await page.getByLabel("מספר השולחנות באולם").fill("1");
  let dialogText = "";
  page.once("dialog", (d) => { dialogText = d.message(); d.accept(); });
  await page.getByRole("button", { name: "צמצום 3 שולחנות" }).click();
  await expect(tableCard(page, "שולחן 2")).toHaveCount(0);
  expect(dialogText).toContain("שולחן 2 – שולחן 4");
  expect(dialogText).toContain("הרשמה אחת שיושבת בהם תחזור");
  await expect(page.getByText("כרגע: שולחן אחד, 3 מקומות")).toBeVisible();
  await expect(page.getByText("לא משובצים (1)")).toBeVisible();

  // Cancelling the warning changes nothing.
  await page.getByLabel("מספר השולחנות באולם").fill("0");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "צמצום שולחן אחד" }).click();
  await expect(tableCard(page, "שולחן 1")).toBeVisible();
});

test("deleting a table returns its guests to not seated", async ({ page }) => {
  await signIn(page);
  await page.goto(`${eventPath}/tables`);
  page.once("dialog", (d) => d.accept());
  await tableCard(page, "שולחן 1").getByRole("button", { name: "מחיקה" }).click();
  await expect(tableCard(page, "שולחן 1")).toHaveCount(0);
  await expect(page.getByText("לא משובצים (2)")).toBeVisible();

  await page.goto(`${eventPath}/edit`);
  await page.uncheck("input[name=is_active]");
  await page.locator("main form button[type=submit]").click();
  await expect(page.getByText("האירוע לא פעיל")).toBeVisible();
});
