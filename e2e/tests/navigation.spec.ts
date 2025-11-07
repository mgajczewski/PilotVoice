import { test, expect } from "../fixtures";

test.describe("Navigation Flow", () => {
  test("should navigate from home to login and back", async ({ page, homePage, loginPage }) => {
    // Start at home
    await homePage.goto();
    expect(await homePage.isLoaded()).toBeTruthy();

    // Navigate to login
    await homePage.navigateToLoginFromHeader();
    expect(page.url()).toContain("/login");
    expect(await loginPage.isLoaded()).toBeTruthy();

    // Go back to home
    await page.goBack();
    expect(page.url()).not.toContain("/login");
  });
});
