import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Home/Landing page
 */
export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly headerLoginButton: Locator;
  readonly headerRegisterButton: Locator;
  readonly heroLoginButton: Locator;
  readonly heroRegisterButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.headerLoginButton = page.getByRole("banner").getByRole("link", { name: /sign in/i });
    this.headerRegisterButton = page.getByRole("banner").getByRole("link", { name: /sign up/i });
    this.heroLoginButton = page.getByRole("main").getByRole("link", { name: /sign in/i });
    this.heroRegisterButton = page.getByRole("main").getByRole("link", { name: /sign up/i });
  }

  async goto() {
    await super.goto("/");
    await this.waitForPageLoad();
  }

  async navigateToLoginFromHeader() {
    await Promise.all([this.page.waitForURL("**/login"), this.headerLoginButton.click()]);
  }

  async navigateToLoginFromHero() {
    await Promise.all([this.page.waitForURL("**/login"), this.heroLoginButton.click()]);
  }

  async navigateToRegisterFromHeader() {
    await Promise.all([this.page.waitForURL("**/register"), this.headerRegisterButton.click()]);
  }

  async navigateToRegisterFromHero() {
    await Promise.all([this.page.waitForURL("**/register"), this.heroRegisterButton.click()]);
  }

  async isLoaded(): Promise<boolean> {
    return await this.heading.isVisible();
  }
}
