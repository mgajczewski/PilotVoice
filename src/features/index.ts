import log from "@/lib/logger";
import type { FeatureFlagSettings } from "@/types";

// --- 1. Types and Environment Configuration ---

// Define the names of your feature flags
type FeatureFlag = "captcha" | "anonymization";

// Define the available environments
type Environment = "development" | "test" | "production";

// --- 2. Feature Flag Configuration ---

const featuresConfig: Record<Environment, FeatureFlagSettings> = {
  development: {
    captcha: false,
    anonymization: "random",
  },
  test: {
    captcha: true,
    anonymization: "none",
  },
  production: {
    captcha: true,
    anonymization: "ai",
  },
};

// --- 3. Feature Flag Access Logic ---

/**
 * Retrieves the current environment from NODE_ENV environment variable.
 * Throws an error if the variable is not set or invalid.
 * @returns {Environment} The current environment.
 */
function getCurrentEnvironment(): Environment {
  const env = import.meta.env.NODE_ENV;
  if (env === "development" || env === "test" || env === "production") {
    return env;
  }
  throw new Error(`Invalid or missing NODE_ENV: "${env}".`);
}

/**
 * Retrieves the value of a specific feature flag for the current environment.
 *
 * @param name The name of the feature flag.
 * @returns The value of the flag (boolean, string, etc.).
 * @example
 * const isCaptchaEnabled = getFeatureFlag("captcha"); // returns boolean
 * const anonymizationMode = getFeatureFlag("anonymization"); // returns 'none', 'random', or 'ai'
 */
export function getFeatureFlag<T extends FeatureFlag>(name: T): FeatureFlagSettings[T] {
  const env = getCurrentEnvironment();
  const config = featuresConfig[env];

  if (config && typeof config[name] !== "undefined") {
    return config[name];
  }

  // Default behavior: return false for undefined boolean flags, or a safe default
  log.warn(`Feature flag "${name}" is not defined for environment "${env}".`);

  // A simple way to provide a "safe" default based on expected type.
  // This part might need to become more sophisticated if more non-boolean flags are added.
  if (name === "anonymization") {
    return "none" as FeatureFlagSettings[T];
  }

  return false as FeatureFlagSettings[T];
}

/**
 * A convenience function to specifically check if a feature is enabled (evaluates to true).
 * This is useful for flags that are strictly boolean.
 *
 * @param name The name of the feature flag.
 * @returns `true` if the flag is enabled, otherwise `false`.
 */
export function isFeatureEnabled(name: FeatureFlag): boolean {
  const value = getFeatureFlag(name);
  return value === true;
}

/**
 * Returns all feature flags for the current environment.
 * Useful for injecting into the client-side.
 * @returns {FeatureFlagSettings} An object containing all feature flags.
 */
export function getAllFeatureFlags(): FeatureFlagSettings {
  const env = getCurrentEnvironment();
  return featuresConfig[env];
}
