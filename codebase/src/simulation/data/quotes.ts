/**
 * Character Quotes Registry
 *
 * Each character ID maps to a QuotesBank — categorized arrays of
 * flavor quotes that fire while they work. Categories map to
 * pipeline phases and general moods.
 *
 * To add quotes for a new character: add an entry keyed by their
 * CharacterDef.id. That's it.
 *
 * Quote categories:
 *   - outreach:   fires during 'prospecting' phase
 *   - closing:    fires during 'sales' phase
 *   - production: fires during 'production' phase
 *   - hustle:     fires during any phase (general energy)
 *   - doubt:      fires during any phase (moments of doubt)
 *   - victory:    fires on step completion events
 */

export type QuoteCategory =
  | 'outreach'
  | 'closing'
  | 'production'
  | 'hustle'
  | 'doubt'
  | 'victory';

export type QuotesBank = Partial<Record<QuoteCategory, string[]>>;

/** Phase → primary quote category mapping */
export const PHASE_QUOTE_MAP: Record<string, QuoteCategory> = {
  prospecting: 'outreach',
  sales: 'closing',
  production: 'production',
  delivery: 'production',
};

/** General categories that can fire during any phase */
export const GENERAL_CATEGORIES: QuoteCategory[] = ['hustle', 'doubt'];

/** Registry: character ID → their quotes */
export const quotesRegistry: Record<string, QuotesBank> = {
  founder: {
    outreach: [
      'One more email... just one more... they\'ll love this one, I can feel it.',
      'Professional tone, professional tone... don\'t tell them their website looks like it\'s from 2003.',
      'Seven rejections today. That\'s just seven "no"s before the "yes." Right? Right?',
      'Okay, nobody pick up. I\'m not ready. I\'m ready. Pick up.',
      'Note to self: learn their CEO\'s name BEFORE calling next time.',
      'Pitch #47. This is the one. It has to be.',
      'Why is my hand shaking? I own the company. I\'m supposed to be cool about this.',
    ],
    closing: [
      'They said yes. They SAID YES. Act normal. Don\'t act normal. Too late.',
      'Sign here, initial here, sacrifice your firstborn here — wait, scratch that last one.',
      'This contract took me 3 hours to write. Worth it? We\'ll see in 30 days.',
    ],
    production: [
      'This is GENIUS.',
      'The client said "make it pop." Pop. What does that even MEAN?',
      'If I stare at this for five more seconds, I\'ll be convinced it\'s terrible. Not looking. Not looking.',
      'They wanted it "modern but timeless." Got it. Vague. Love that for me.',
    ],
    hustle: [
      'Fake it till you make it. Except I\'m not faking anymore, so... this must be it?',
      'I\'m three cups of coffee away from becoming sentient.',
      'Who needs work-life balance when you ARE the work?',
      'Every "no" just means I\'m getting closer to a "yes."',
    ],
    doubt: [
      'Maybe I should get a real job. Nah. I\'m in too deep now.',
      'If this doesn\'t work, at least I\'ll have a great story for my friends.',
      'Pretty sure I\'m insane for doing this. Pretty sure it\'s going to work though.',
      'My friends are sleeping. I\'m here building an empire. Or a very expensive hobby.',
    ],
    victory: [
      'YES! That email has a 40% open rate! I\'m basically a genius.',
      'Client didn\'t ask for a revision. This is my best day ever.',
      'Oh, they want to extend the contract? *chef\'s kiss*',
    ],
  },
};
