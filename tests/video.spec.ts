import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// An event video: staff upload it in the event form, guests get a player and
// a QR code that opens it, staff get a printable QR. Event deactivated at the end.
const email = process.env.E2E_STAFF_EMAIL;
const password = process.env.E2E_STAFF_PASSWORD;

test.describe.configure({ mode: "serial" });
test.skip(!email || !password, "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD not set");

async function signIn(page: Page) {
  await page.goto("/login");
  await page.fill("#email", email!);
  await page.fill("#password", password!);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/admin$/);
}

test("event video shows on the invitation with a QR code", async ({ page, browser }) => {
  await signIn(page);
  await page.goto("/admin/events/new");
  await page.fill("#title", `[E2E] וידאו ${Date.now()}`);
  await page.fill("#date_time", "2030-03-01T19:00");
  await page.locator("input[type=file][accept*='video']").setInputFiles(path.join(__dirname, "fixtures/sample.mp4"));
  await expect(page.locator("video[aria-label]")).toBeVisible({ timeout: 30_000 });
  const videoUrl = await page.locator("input[name=video_url]").inputValue();
  expect(videoUrl).toMatch(/\/storage\/v1\/object\/public\/event-media\/events\/.+\.mp4$/);

  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}$/);
  const eventPath = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { name: "ברקוד לסרטון" })).toBeVisible();
  const slug = (await page.locator("code").textContent())!.trim().split("/e/")[1];

  const guest = await (await browser.newContext({ locale: "he-IL" })).newPage();
  await guest.goto(`/e/${slug}`);
  // No player on the invitation: the video is reached through the QR only,
  // and tapping the QR opens it (for guests viewing on their phone).
  await expect(guest.locator("main video")).toHaveCount(0);
  const qr = guest.getByRole("img", { name: "ברקוד שפותח את הסרטון" });
  await expect(guest.locator("a").filter({ has: qr })).toHaveAttribute("href", videoUrl);
  await expect(qr).toBeVisible();
  expect(await qr.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
  // The video file is publicly reachable (what the QR opens).
  const res = await guest.request.get(videoUrl);
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("video/mp4");

  await page.goto(`${eventPath}/edit`);
  await page.uncheck("input[name=is_active]");
  await page.locator("main form button[type=submit]").click();
  await expect(page.getByText("האירוע לא פעיל")).toBeVisible();
});
