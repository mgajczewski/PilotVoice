import { faker } from "@faker-js/faker";
import type { SurveyResponseDto } from "../../src/types";

/**
 * Generates test data for authentication
 */
export const generateTestUser = () => ({
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12, memorable: true }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
});

/**
 * Generates test data for survey responses
 */
export const generateSurveyResponse = () => ({
  rating: faker.number.int({ min: 1, max: 5 }),
  feedback: faker.lorem.paragraph(),
});

/**
 * Generates a complete SurveyResponseDto for testing
 */
export const generateSurveyResponseDto = (overrides?: Partial<SurveyResponseDto>): SurveyResponseDto => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  survey_id: faker.number.int({ min: 1, max: 1000 }),
  user_id: faker.string.uuid(),
  overall_rating: faker.helpers.arrayElement([1, 2, 3, 4, 5, null]),
  open_feedback: faker.helpers.arrayElement([faker.lorem.paragraph(), null]),
  completed_at: faker.helpers.arrayElement([faker.date.recent().toISOString(), null]),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Generates test data for competitions
 */
export const generateCompetition = () => ({
  name: faker.company.name(),
  location: faker.location.city(),
  startsAt: faker.date.future(),
  endsAt: faker.date.future(),
});

/**
 * Wait helper for async operations
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
