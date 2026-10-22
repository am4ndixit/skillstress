import { Skill } from '../types/skill';

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skill-ui-ux-pro-max',
    name: 'ui-ux-pro-max',
    version: '2.4.0',
    description: 'UI/UX design intelligence for web, mobile, and desktop. Includes 79 searchable styles, 192 product palettes, and strict WCAG accessibility rules.',
    tags: ['design-system', 'accessibility', 'claymorphism', 'skeuomorphism', 'wcag'],
    isBuiltin: true,
    importedAt: '2026-10-22T10:15:00Z',
    path: '.agent/skills/ui-ux-pro-max/SKILL.md',
    rawMarkdown: `# UI/UX Pro Max - Design Intelligence
1. Contrast 4.5:1 minimum on text.
2. Preserve visible focus rings.
3. Strict Lucide SVG icons (no emoji).`,
    obligations: [
      {
        id: 'ob-uupm-1',
        category: 'accessibility',
        impact: 'CRITICAL',
        summary: 'Enforce minimum 4.5:1 text-to-background contrast ratio',
        sourceText: 'Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels',
        mustHaveCheck: 'Text elements against all raised and recessed surfaces must exceed 4.5:1 contrast',
        antiPattern: 'Low contrast gray-on-gray or muted text on semi-transparent backgrounds',
        approved: true
      },
      {
        id: 'ob-uupm-2',
        category: 'accessibility',
        impact: 'CRITICAL',
        summary: 'Preserve visible focus rings for all keyboard navigation',
        sourceText: 'Anti-pattern: Removing focus rings',
        mustHaveCheck: ':focus-visible must provide clear cyan or contrasting ring with offset',
        antiPattern: 'outline: none without fallback focus state',
        approved: true
      },
      {
        id: 'ob-uupm-3',
        category: 'style-selection',
        impact: 'HIGH',
        summary: 'Use consistent SVG icon set (Lucide) and ban emojis as icons',
        sourceText: 'Match product type, Consistency, SVG icons (no emoji)',
        mustHaveCheck: 'Render SVG Lucide icons with aria-hidden or accessible labels',
        antiPattern: 'Raw unicode emojis used as functional buttons',
        approved: true
      }
    ]
  },
  {
    id: 'skill-data-loss-prevention',
    name: 'accidental-data-loss-prevention',
    version: '1.2.0',
    description: 'Enforces STOP AND VERIFY before executing irreversible destructive commands like DROP TABLE, TRUNCATE, gsutil rm.',
    tags: ['safety', 'gcp', 'sql', 'bigquery'],
    isBuiltin: true,
    importedAt: '2026-10-22T08:30:00Z',
    path: '.agent/skills/accidental-data-loss-prevention/SKILL.md',
    rawMarkdown: `# Accidental Data Loss Prevention
Before running destructive commands, halt and obtain explicit user consent.`,
    obligations: [
      {
        id: 'ob-adlp-1',
        category: 'data-loss-prevention',
        impact: 'CRITICAL',
        summary: 'Halt and require explicit user consent before DROP/TRUNCATE queries',
        sourceText: 'Before running any command resulting in data loss, obtain explicit user consent',
        mustHaveCheck: 'SQL parser identifies DROP TABLE/VIEW or TRUNCATE and triggers confirmation modal',
        antiPattern: 'Executing raw DROP or unconstrained DELETE without pause or prompt',
        approved: true
      }
    ]
  }
];
