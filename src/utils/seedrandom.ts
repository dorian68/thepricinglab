
/**
 * Simple seedable random number generator utility
 * This is a lightweight implementation to replace the missing Math.seedrandom
 */

// Store the current seed and generator
let seed = 42;
let z = seed;

/**
 * Set a seed for the random number generator
 * @param newSeed The seed to use
 */
export const setSeed = (newSeed: number): void => {
  seed = newSeed;
  z = seed;
};

/**
 * Generate a random number between 0 and 1 using the current seed
 * @returns A pseudo-random number between 0 and 1
 */
export const seededRandom = (): number => {
  // Simple multiplicative congruential generator
  z = (36969 * (z & 65535) + (z >> 16)) & 0xFFFFFFFF;
  return (z & 0x7FFFFFFF) / 0x7FFFFFFF;
};

/**
 * Reset the generator to the initial seed
 */
export const resetSeed = (): void => {
  z = seed;
};

export default {
  setSeed,
  seededRandom,
  resetSeed
};
