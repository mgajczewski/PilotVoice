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
    this.heading = page.getByTestId("home-heading");
    this.headerLoginButton = page.getByTestId("header-login");
    this.headerRegisterButton = page.getByTestId("header-register");
    this.heroLoginButton = page.getByTestId("home-login");
    this.heroRegisterButton = page.getByTestId("home-register");
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
