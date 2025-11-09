import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Survey landing page (/surveys/[slug])
 */
export class SurveyPage extends BasePage {
  readonly surveyInfoCard: Locator;
  readonly competitionName: Locator;
  readonly competitionDates: Locator;
  readonly competitionLocation: Locator;
  readonly competitionInfo: Locator;
  readonly anonymityInfo: Locator;
  readonly surveyStartButton: Locator;
  readonly surveyStartAction: Locator;
  readonly surveyStartLoading: Locator;
  readonly surveyStartError: Locator;

  constructor(page: Page) {
    super(page);
    this.surveyInfoCard = page.getByTestId("survey-info-card");
    this.competitionName = page.getByTestId("survey-competition-name");
    this.competitionDates = page.getByTestId("survey-competition-dates");
    this.competitionLocation = page.getByTestId("survey-competition-location");
    this.competitionInfo = page.getByTestId("survey-competition-info");
    this.anonymityInfo = page.getByTestId("survey-anonymity-info");
    this.surveyStartButton = page.getByTestId("survey-start-button");
    this.surveyStartAction = page.getByTestId("survey-start-action");
    this.surveyStartLoading = page.getByTestId("survey-start-loading");
    this.surveyStartError = page.getByTestId("survey-start-error");
  }

  async goto(slug: string) {
    await super.goto(`/surveys/${slug}`);
    await this.waitForPageLoad();
  }

  async waitForDataLoaded() {
    // Wait for loading state to disappear
    await this.surveyStartLoading.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {
      // Loading might already be gone
    });
    // Wait for either action button or error to appear
    await Promise.race([
      this.surveyStartAction.waitFor({ state: "visible" }),
      this.surveyStartError.waitFor({ state: "visible" }),
    ]);
  }

  async clickStartButton() {
    await this.surveyStartButton.click();
  }

  async getCompetitionName(): Promise<string> {
    return (await this.competitionName.textContent()) || "";
  }

  async getCompetitionDates(): Promise<string> {
    return (await this.competitionDates.textContent()) || "";
  }

  async getCompetitionLocation(): Promise<string> {
    return (await this.competitionLocation.textContent()) || "";
  }

  async getStartButtonText(): Promise<string> {
    return (await this.surveyStartButton.textContent()) || "";
  }

  async isCompetitionInfoVisible(): Promise<boolean> {
    return await this.competitionInfo.isVisible();
  }

  async isAnonymityInfoVisible(): Promise<boolean> {
    return await this.anonymityInfo.isVisible();
  }

  async isStartButtonVisible(): Promise<boolean> {
    return await this.surveyStartButton.isVisible();
  }

  async isLoaded(): Promise<boolean> {
    return await this.surveyInfoCard.isVisible();
  }
}
