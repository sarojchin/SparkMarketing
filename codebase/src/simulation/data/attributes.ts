/**
 * Character Attributes — letter-grade system (F → S++)
 *
 * Each attribute maps to a numeric multiplier for gameplay calculations.
 * A = 1.0 baseline. Grades below A reduce effectiveness, above A amplify it.
 *
 * To add a new attribute: add it to AttributeName and ATTRIBUTE_LABELS.
 */

export type Grade = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'S++';

export const GRADE_ORDER: Grade[] = ['F', 'D', 'C', 'B', 'A', 'S', 'S+', 'S++'];

export type AttributeName = 'persistence' | 'empathy' | 'genius' | 'speed';

export const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  persistence: 'Persistence',
  empathy: 'Empathy',
  genius: 'Genius',
  speed: 'Speed',
};

export const ATTRIBUTE_DESCRIPTIONS: Record<AttributeName, string> = {
  persistence: 'Willingness to work without burning out',
  empathy: 'Impact on group morale and cohesion',
  genius: 'Quality of work produced',
  speed: 'How fast they work and function',
};

export type AttributeGrades = Record<AttributeName, Grade>;

/** Numeric multiplier per grade. A = 1.0 baseline. */
export const GRADE_MULTIPLIERS: Record<Grade, number> = {
  'F':   0.1,
  'D':   0.3,
  'C':   0.5,
  'B':   0.75,
  'A':   1.0,
  'S':   1.3,
  'S+':  1.6,
  'S++': 2.0,
};

export function getMultiplier(grade: Grade): number {
  return GRADE_MULTIPLIERS[grade];
}

/** Grade badge colors for UI display */
export const GRADE_COLORS: Record<Grade, string> = {
  'F':   '#dc2626', // red
  'D':   '#ea580c', // orange
  'C':   '#ca8a04', // yellow
  'B':   '#2563eb', // blue
  'A':   '#16a34a', // green
  'S':   '#7c3aed', // purple
  'S+':  '#db2777', // pink
  'S++': '#f59e0b', // gold
};

/** Morale range definitions for UI */
export const MORALE_RANGES = [
  { min: 0,  max: 20,  label: 'Failure',       color: '#dc2626' },
  { min: 20, max: 40,  label: 'Heavily Upset',  color: '#ea580c' },
  { min: 40, max: 60,  label: 'Frustrated',     color: '#ca8a04' },
  { min: 60, max: 80,  label: 'Content',        color: '#16a34a' },
  { min: 80, max: 101, label: 'Excellent',      color: '#2563eb' },
] as const;

export function getMoraleRange(morale: number) {
  return MORALE_RANGES.find(r => morale >= r.min && morale < r.max) ?? MORALE_RANGES[0];
}
