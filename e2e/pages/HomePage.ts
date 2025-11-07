import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Home/Landing page
 */
export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.loginButton = page.getByRole('link', { name: /login|zaloguj/i });
    this.registerButton = page.getByRole('link', { name: /register|zarejestruj/i });
  }

  async goto() {
    await super.goto('/');
    await this.waitForPageLoad();
  }

  async navigateToLogin() {
    await this.loginButton.click();
    await this.waitForPageLoad();
  }

  async navigateToRegister() {
    await this.registerButton.click();
    await this.waitForPageLoad();
  }

  async isLoaded(): Promise<boolean> {
    return await this.heading.isVisible();
  }
}

