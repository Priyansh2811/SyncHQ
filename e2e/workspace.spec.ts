import { test, expect } from "@playwright/test";
test("register, create a workspace and channel, then send, edit and delete a persisted message", async ({
  page,
}) => {
  const stamp = Date.now(),
    email = `e2e-${stamp}@example.test`,
    password = "test-password-secure-123";
  await page.goto("/register");
  await page.getByLabel("Your name").fill("E2E Teammate");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/onboarding\/workspace/);
  await page.getByLabel("Workspace name").fill(`E2E ${stamp}`);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/w\//);
  await page.getByRole("button", { name: "Create channel" }).click();
  await page.getByLabel("Channel name").fill("test-room");
  await page.getByRole("button", { name: "Create channel" }).last().click();
  await expect(page).toHaveURL(/\/c\/test-room/);
  const composer = page.getByLabel("Message #test-room");
  await composer.fill("A message that persists across reloads.");
  await composer.press("Enter");
  await expect(
    page.getByText("A message that persists across reloads."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit message" }).click();
  await page.getByLabel("Edit message").fill("An edited persisted message.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("An edited persisted message.")).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete message" }).click();
  await expect(page.getByText("This message was deleted.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("This message was deleted.")).toBeVisible();
});
