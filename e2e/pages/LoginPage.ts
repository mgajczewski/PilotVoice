import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Login page
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.locator("#email-error");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");
  }

  async goto() {
    await super.goto("/login");
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.page.waitForTimeout(100);
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(100);
    await this.emailInput.blur();
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  async isLoaded(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }
}
