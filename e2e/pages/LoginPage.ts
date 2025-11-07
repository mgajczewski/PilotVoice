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
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.getByLabel(/password|hasło/i);
    this.submitButton = page.getByRole("button", { name: /login|zaloguj/i });
    this.errorMessage = page.getByRole("alert");
    this.forgotPasswordLink = page.getByRole("link", { name: /forgot password|zapomniał/i });
  }

  async goto() {
    await super.goto("/login");
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
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
