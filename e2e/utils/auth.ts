import { chromium } from "@playwright/test";
import path from "path";
import { LoginPage } from "../pages/LoginPage";

/**
 * Creates an authenticated session for the given user and saves it to a storageState file.
 * @param baseURL - The base URL of the application
 * @param email - User email
 * @param password - User password
 * @param outputPath - Path where to save the auth.json file (defaults to e2e/auth.json)
 */
export async function createAuthenticatedSession(
  baseURL: string,
  email: string,
  password: string,
  outputPath: string = path.join(process.cwd(), "e2e", "auth.json")
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    // Use LoginPage Page Object
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    // Wait for redirect to home page
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });

    // Save authenticated state
    await context.storageState({ path: outputPath });

    console.log(`✓ Authenticated state saved to ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to create authenticated session: ${error}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
