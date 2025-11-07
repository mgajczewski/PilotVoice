import { faker } from '@faker-js/faker';

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

