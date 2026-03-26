/**
 * Character Definitions
 * 
 * These are templates — the factory function reads these
 * and spawns proper ECS entities with all required components.
 * 
 * To add a new employee: add an entry here. That's it.
 */

export interface CharacterDef {
  id: string;
  name: string;
  role: string;
  department: string;
  shortLabel: string;
  colors: {
    primary: string;   // shirt / accent
    hair: string;
    skin: string;
  };
  skills: Record<string, number>;
  behaviorWeights: {
    work: number;
    coffee: number;
    wander: number;
    chat: number;
    whiteboard: number;
  };
}

export const SOLO_FOUNDER: CharacterDef[] = [
  {
    id: 'founder',
    name: 'Alex Chen',
    role: 'Founder',
    department: 'Everything',
    shortLabel: 'Founder',
    colors: {
      primary: '#60a5fa',
      hair: '#1c1917',
      skin: '#deb887',
    },
    skills: { hustle: 70, design: 50, writing: 60, sales: 55 },
    behaviorWeights: {
      work: 0.75,
      coffee: 0.15,
      wander: 0.10,
      chat: 0,
      whiteboard: 0,
    },
  },
];

export const SPARK_TEAM: CharacterDef[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    role: 'CEO / Founder',
    department: 'Leadership',
    shortLabel: 'CEO',
    colors: {
      primary: '#f472b6',
      hair: '#1c1917',
      skin: '#deb887',
    },
    skills: { strategy: 80, communication: 90, design: 40 },
    behaviorWeights: {
      work: 0.15,
      coffee: 0.15,
      wander: 0.20,
      chat: 0.35,
      whiteboard: 0.15,
    },
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    role: 'Content Strategist',
    department: 'Content',
    shortLabel: 'Content',
    colors: {
      primary: '#60a5fa',
      hair: '#92400e',
      skin: '#d2a679',
    },
    skills: { writing: 75, seo: 65, strategy: 50 },
    behaviorWeights: {
      work: 0.55,
      coffee: 0.15,
      wander: 0.10,
      chat: 0.15,
      whiteboard: 0.05,
    },
  },
  {
    id: 'jordan',
    name: 'Jordan Park',
    role: 'Ads Manager',
    department: 'Paid Media',
    shortLabel: 'Ads',
    colors: {
      primary: '#4ade80',
      hair: '#1c1917',
      skin: '#f0c8a0',
    },
    skills: { analytics: 80, ads: 85, copywriting: 55 },
    behaviorWeights: {
      work: 0.60,
      coffee: 0.15,
      wander: 0.05,
      chat: 0.10,
      whiteboard: 0.10,
    },
  },
  {
    id: 'sam',
    name: 'Sam Okafor',
    role: 'Designer',
    department: 'Creative',
    shortLabel: 'Design',
    colors: {
      primary: '#fbbf24',
      hair: '#44403c',
      skin: '#8B6914',
    },
    skills: { design: 85, branding: 70, illustration: 60 },
    behaviorWeights: {
      work: 0.50,
      coffee: 0.20,
      wander: 0.10,
      chat: 0.10,
      whiteboard: 0.10,
    },
  },
];
