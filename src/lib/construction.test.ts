import { describe, expect, it } from 'vitest';
import { suffixes } from './data';
import { construction } from './construction';

describe('construction', () => {
  it('every suffix has at least one buildable sample', () => {
    for (const s of suffixes) expect(construction(s.id).length, s.id).toBeGreaterThan(0);
  });
  it('splits stem and suffix piece', () => {
    const rows = construction('causative');
    expect(rows.find((r) => r.words.includes('書く'))).toMatchObject({ stem: 'mizenkei', base: '書か', piece: 'せる' });
    expect(rows.find((r) => r.words.includes('食べる'))).toMatchObject({ base: '食べ', piece: 'させる' });
  });
});
