/**
 * Seeded PRNG — deterministic random numbers.
 * Same seed = same simulation every time.
 * Critical for debugging and A/B testing.
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed;
  }

  /** Returns float in [0, 1) */
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.state >>> 0) / 0xFFFFFFFF;
  }

  /** Returns int in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns float in [min, max) */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Normal distribution via Box-Muller */
  normal(mean = 0, std = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    return mean + std * Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
  }

  /** Returns true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Shuffle array in place */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Pick from weighted options */
  weighted<T>(options: { value: T; weight: number }[]): T {
    const total = options.reduce((s, o) => s + o.weight, 0);
    let r = this.next() * total;
    for (const opt of options) {
      r -= opt.weight;
      if (r <= 0) return opt.value;
    }
    return options[options.length - 1].value;
  }
}

/** Global RNG instance — set seed once at sim start */
export const rng = new SeededRNG(12345);
