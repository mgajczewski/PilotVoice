/* eslint-disable react-hooks/rules-of-hooks */
// Playwright fixtures use "use" parameter which triggers React hooks rule
// but this is not React code, it's Playwright's fixture mechanism
import { test as base } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { SurveyPage } from "../pages/SurveyPage";
import { SurveyFillPage } from "../pages/SurveyFillPage";
import { createSupabaseTestClient, type SupabaseTestClient } from "../utils/supabase";
import { FixtureCleanup } from "./survey-fixtures";

/**
 * Extended test with fixtures for common page objects and test data management
 * This makes it easier to use page objects in tests and ensures proper cleanup
 */
interface TestFixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  surveyPage: SurveyPage;
  surveyFillPage: SurveyFillPage;
  supabase: SupabaseTestClient;
  cleanup: FixtureCleanup;
}

export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  surveyPage: async ({ page }, use) => {
    const surveyPage = new SurveyPage(page);
    await use(surveyPage);
  },

  surveyFillPage: async ({ page }, use) => {
    const surveyFillPage = new SurveyFillPage(page);
    await use(surveyFillPage);
  },

  supabase: async (_page, use) => {
    const client = createSupabaseTestClient();
    await use(client);
  },

  cleanup: async ({ supabase }, use) => {
    const cleanup = new FixtureCleanup();
    await use(cleanup);
    // Cleanup runs AFTER the test completes, even if it fails
    await cleanup.cleanup(supabase);
  },
});

export { expect } from "@playwright/test";
