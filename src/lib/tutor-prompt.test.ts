import { describe, expect, it } from 'vitest';
import { construction } from './construction';
import * as data from './data';
import { guidePrompt, stemPrompt, suffixPrompt } from './tutor-prompt';
import { suffixName } from './names';

describe('tutor prompts', () => {
  it('every suffix prompt carries the rule, three examples and the teaching instructions', () => {
    for (const s of data.suffixes) {
      const prompt = suffixPrompt({
        suffix: { ...s, title: suffixName(s) },
        attach: s.attaches_to,
        rows: construction(s.id),
        compare: s.compare.map((c) => ({ label: c.label ?? c.id ?? '', difference: c.difference })),
        path: `/reference/suffixes/${s.attaches_to}/${s.id}/`,
      });
      expect(prompt, s.id).toContain(s.meaning);
      expect(prompt, s.id).toContain('HOW IT IS BUILT');
      for (const e of s.examples) expect(prompt, s.id).toContain(e.japanese);
      expect(prompt, s.id).toContain('Ask, don\'t tell');
      expect(prompt, s.id).not.toMatch(/undefined|\[object/);
    }
  });
  it('uses the right article before a type', () => {
    const tai = data.suffixes.find((s) => s.id === 'tai')!;
    const prompt = suffixPrompt({ suffix: { ...tai, title: 'たい' }, attach: 'x', rows: construction('tai'), compare: [], path: '/' });
    expect(prompt).toContain('an い-adjective');
  });
  it('stem and guide prompts carry the teaching instructions', () => {
    expect(stemPrompt({ name: 'x', label: 'y', description: 'z', rules: ['r'], suffixes: ['s'], path: '/' })).toContain('learning mode');
    expect(guidePrompt({ title: 't', description: 'd', path: '/' })).toContain('learning mode');
  });
});
