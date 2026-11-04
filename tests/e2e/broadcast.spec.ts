import { expect, test, type BrowserContext, type Page } from "@playwright/test";

/** Dock and overlay open side by side in one browser profile, like OBS. */
async function open(context: BrowserContext): Promise<{ dock: Page; overlay: Page }> {
  const overlay = await context.newPage();
  await overlay.setViewportSize({ width: 1920, height: 1080 });
  await overlay.goto("#/overlay");
  const dock = await context.newPage();
  await dock.setViewportSize({ width: 420, height: 900 });
  await dock.goto("#/dock");
  return { dock, overlay };
}

test("first open seeds the sample and the overlay shows the Active race", async ({ context }) => {
  const { dock, overlay } = await open(context);
  await expect(dock.getByTestId("active-tag")).toHaveText("Active: 11R");
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-name]")).toHaveText("Sample Cup");
  await expect(overlay.locator("[data-layer][data-active] [data-no]")).toHaveCount(18);
  await expect(overlay.locator("[data-layer][data-active] [data-no][data-hl=on]")).toHaveAttribute("data-no", "9");
});

test("setting home or another race Active switches the overlay with a transition", async ({ context }) => {
  const { dock, overlay } = await open(context);
  await dock.getByRole("button", { name: "ตั้งหน้าแรกเป็น Active" }).click();
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-list]")).toBeVisible();
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-list-row]")).toHaveCount(3);
  await expect(overlay.locator("[data-layer]")).toHaveCount(1, { timeout: 3000 });
  await dock.getByLabel("ทรานซิชัน").selectOption("none");
  await dock.getByRole("button", { name: /ตั้ง 12R .* เป็น Active/ }).click();
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-name]")).toHaveText("Sample Juvenile");
  await expect(dock.getByTestId("active-tag")).toHaveText("Active: 12R");
});

test("edits in the dock reach the overlay: name, round, highlight, toggles, flags", async ({ context }) => {
  const { dock, overlay } = await open(context);
  await dock.getByRole("button", { name: "แก้ไข 11R Sample Cup" }).click();
  await dock.getByLabel("ชื่อรายการ").fill("Edited Cup");
  await dock.getByLabel("เลขรอบ").fill("Main");
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-name]")).toHaveText("Edited Cup");
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-facts]")).toContainText("Main Tokyo");
  await dock.locator("[data-h='3']").click();
  await expect(overlay.locator("[data-layer][data-active] [data-no][data-hl=on]")).toHaveAttribute("data-no", "3");
  await expect(overlay.locator("[data-layer][data-active] [data-no][data-hl=out]")).toHaveAttribute("data-no", "9");
  await dock.getByRole("button", { name: "ธงม้าเบอร์ 1: ญี่ปุ่น" }).click();
  await dock.getByLabel("ค้นหาประเทศ").fill("nzl");
  await dock.getByRole("option", { name: /นิวซีแลนด์/ }).click();
  await expect(overlay.locator("[data-layer][data-active] [data-no='1'] [data-testid=horse] img")).toHaveAttribute("alt", "NZ");
  await dock.getByRole("tab", { name: "สไตล์" }).click();
  await dock.getByTestId("show-draw").click();
  await expect(overlay.locator("[data-layer][data-active] [data-testid=table-head] span")).toHaveText(["NO.", "HORSE", "JOCKEY"]);
});

test("home page settings and race highlight", async ({ context }) => {
  const { dock, overlay } = await open(context);
  await dock.getByRole("button", { name: "ตั้งหน้าแรกเป็น Active" }).click();
  await dock.getByLabel("Title", { exact: true }).fill("Kyoto Races");
  await dock.getByLabel("Sub title (วันที่)").fill("2026.12.06");
  await dock.locator("[data-lh='sample-12']").click();
  const live = overlay.locator("[data-layer][data-active]");
  await expect(live.locator("[data-testid=home-title]")).toHaveText("Kyoto Races");
  await expect(live.locator("[data-testid=home-subtitle]")).toHaveText("2026.12.06");
  await expect(live.locator("[data-testid=race-list-row][data-hl=on]")).toHaveAttribute("data-race", "sample-12");
});

test("import JSON (append / replace), reject a bad file, delete with confirm", async ({ context }) => {
  const { dock, overlay } = await open(context);
  const file = { name: "races.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ races: [{ date: "2026-12-06", course: "Kyoto", round: "11R", name: "Imported Stakes", runners: [{ number: 1, name: "A" }, { number: 2, name: "B" }] }] })) };
  await dock.getByTestId("import-file").setInputFiles(file);
  await dock.getByRole("button", { name: "เพิ่มต่อ" }).click();
  await expect(dock.getByRole("status")).toContainText("นำเข้า 1 รายการแล้ว");
  await expect(dock.getByTestId("race-row")).toHaveCount(4);

  await dock.getByTestId("import-file").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{ nope") });
  await expect(dock.getByRole("alert")).toContainText("นำเข้าไม่ได้");

  await dock.getByRole("button", { name: /ลบ 11R Sample Cup/ }).click();
  await dock.getByRole("button", { name: "ลบ", exact: true }).click();
  await expect(dock.getByTestId("race-row")).toHaveCount(3);
  // the deleted race was Active, so the overlay falls back to the home page
  await expect(overlay.locator("[data-layer][data-active] [data-testid=race-list]")).toBeVisible();

  await dock.getByTestId("import-file").setInputFiles(file);
  await dock.getByRole("button", { name: "แทนที่ทั้งหมด" }).click();
  await expect(dock.getByTestId("race-row")).toHaveCount(1);
});

test("two-column card for more than 18 runners", async ({ context }) => {
  const { dock, overlay } = await open(context);
  await dock.getByRole("button", { name: "แก้ไข 11R Sample Cup" }).click();
  for (let i = 0; i < 4; i++) await dock.getByRole("button", { name: "+ เพิ่มม้า" }).click();
  await expect(overlay.locator("[data-layer][data-active] [data-testid=runner-column]")).toHaveCount(2);
  await expect(overlay.locator("[data-layer][data-active] [data-no]")).toHaveCount(22);
});
