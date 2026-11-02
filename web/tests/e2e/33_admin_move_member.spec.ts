import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { registerUser, signInAsAdmin } from "./helpers";

async function newMember(browser: Browser, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerUser(page, name);
  const id: string = (await (await page.request.get("/api/auth/me")).json()).id;
  return { context, page, request: page.request, id };
}

async function createFamily(request: APIRequestContext, name: string) {
  const res = await request.post("/api/families", { data: { name } });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: string; invite_code: string };
}

async function joinFamily(request: APIRequestContext, code: string) {
  const res = await request.post("/api/families/join", { data: { code } });
  expect(res.ok()).toBeTruthy();
}

async function addWish(request: APIRequestContext, title: string) {
  const res = await request.post("/api/wishlists/me/items", { data: { title } });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: string };
}

async function reserve(request: APIRequestContext, itemId: string) {
  const res = await request.post(`/api/wishlists/items/${itemId}/reserve`);
  expect(res.status()).toBe(200);
}

async function ownTitles(request: APIRequestContext) {
  const { items } = await (await request.get("/api/wishlists/me")).json();
  return (items as { title: string }[]).map((item) => item.title).sort();
}

async function memberNames(request: APIRequestContext) {
  const members = await (await request.get("/api/families/members")).json();
  return (members as { name: string }[]).map((member) => member.name);
}

async function moveFromAdmin(
  page: Page,
  { from, name, to }: { from: string; name: string; to: string },
) {
  await page.goto("/admin");
  await page
    .locator(`[data-test="admin-family"][data-name="${from}"]`)
    .locator(`[data-test="admin-member"][data-name="${name}"]`)
    .click();
  await page.click('[data-test="admin-move"]');
  await page.selectOption('[data-test="admin-move-family"]', { label: to });
  await page.click('[data-test="admin-move-next"]');
  const impact = page.locator('[data-test="admin-move-impact"]');
  await expect(impact).toBeVisible();
  return impact;
}

async function confirmMove(page: Page) {
  const moved = page.waitForResponse(
    (res) => res.url().endsWith("/family") && res.request().method() === "PUT",
  );
  await page.click('[data-test="inline-confirm-accept"]');
  expect((await moved).status()).toBe(200);
}

test("the admin moves a member: their list follows, the crossing reservations go", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const oldFamily = `Famille Départ ${suffix}`;
  const newFamily = `Famille Arrivée ${suffix}`;

  const ana = await newMember(browser, `Ana ${suffix}`);
  const bob = await newMember(browser, `Bob ${suffix}`);
  const cleo = await newMember(browser, `Cleo ${suffix}`);

  const { invite_code } = await createFamily(ana.request, oldFamily);
  await joinFamily(bob.request, invite_code);
  await createFamily(cleo.request, newFamily);

  const anaWish = await addWish(ana.request, `Écharpe ${suffix}`);
  const bobWish = await addWish(bob.request, `Gants ${suffix}`);
  await reserve(bob.request, anaWish.id);
  await reserve(ana.request, bobWish.id);

  await signInAsAdmin(page);
  const impact = await moveFromAdmin(page, {
    from: oldFamily,
    name: `Ana ${suffix}`,
    to: newFamily,
  });
  await expect(impact).toContainText("1 envie part avec sa liste");
  await expect(impact).toContainText("1 réservation faite dans l’ancienne famille");
  await expect(impact).toContainText("1 réservation sur sa liste disparaît");
  await expect(impact).not.toContainText("ancienne liste");
  await confirmMove(page);

  await expect(page.locator("h1 + p")).toContainText(newFamily);
  expect(await ownTitles(ana.request)).toEqual([`Écharpe ${suffix}`]);
  expect(await memberNames(cleo.request)).toContain(`Ana ${suffix}`);
  expect(await memberNames(bob.request)).not.toContain(`Ana ${suffix}`);

  const bobDetail = await (await page.request.get(`/api/admin/users/${bob.id}`)).json();
  const anaDetail = await (await page.request.get(`/api/admin/users/${ana.id}`)).json();
  expect(bobDetail.items.map((item: { reserved: boolean }) => item.reserved)).toEqual([false]);
  expect(anaDetail.items.map((item: { reserved: boolean }) => item.reserved)).toEqual([false]);

  await Promise.all([ana, bob, cleo].map((member) => member.context.close()));
});

test("moving a member back where they left a list joins the two lists", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const firstFamily = `Famille Ancienne ${suffix}`;
  const secondFamily = `Famille Nouvelle ${suffix}`;

  const dan = await newMember(browser, `Dan ${suffix}`);
  const eve = await newMember(browser, `Eve ${suffix}`);

  await createFamily(dan.request, firstFamily);
  await addWish(dan.request, `Livre ${suffix}`);
  const { invite_code } = await createFamily(eve.request, secondFamily);
  await joinFamily(dan.request, invite_code);
  await addWish(dan.request, `Bougie ${suffix}`);
  expect(await ownTitles(dan.request)).toEqual([`Bougie ${suffix}`]);

  await signInAsAdmin(page);
  const impact = await moveFromAdmin(page, {
    from: secondFamily,
    name: `Dan ${suffix}`,
    to: firstFamily,
  });
  await expect(impact).toContainText(`Une ancienne liste de Dan ${suffix}`);
  await confirmMove(page);

  expect(await ownTitles(dan.request)).toEqual([`Bougie ${suffix}`, `Livre ${suffix}`]);

  await Promise.all([dan, eve].map((member) => member.context.close()));
});
