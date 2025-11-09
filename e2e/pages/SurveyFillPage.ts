import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Survey Fill page (/surveys/[slug]/fill)
 */
export class SurveyFillPage extends BasePage {
  readonly surveyFillPage: Locator;

  constructor(page: Page) {
    super(page);
    this.surveyFillPage = page.getByTestId("survey-fill-page");
  }

  async goto(slug: string) {
    await super.goto(`/surveys/${slug}/fill`);
    await this.waitForPageLoad();
  }

  async isLoaded(): Promise<boolean> {
    return await this.surveyFillPage.isVisible();
  }

  async waitForPageVisible() {
    await this.surveyFillPage.waitFor({ state: "visible", timeout: 10000 });
  }
}
