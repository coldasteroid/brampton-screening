// Bylaw corpus for RAG. Hand-curated from publicly published Brampton by-laws
// and Ontario's Administrative Monetary Penalty System framework. Each entry
// is one retrievable chunk: a section the agent can cite verbatim.

export interface BylawChunk {
  id: string;
  bylaw: string;
  section: string;
  title: string;
  jurisdiction: 'brampton' | 'ontario';
  category: 'parking' | 'property' | 'rental' | 'safety' | 'procedure';
  body: string;
}

export const BYLAW_CORPUS: BylawChunk[] = [
  {
    id: 'brampton-93-93-s6',
    bylaw: 'Traffic By-law 93-93',
    section: 's. 6(1)',
    title: 'Obstructing a sidewalk',
    jurisdiction: 'brampton',
    category: 'parking',
    body: 'No person shall stop or park a vehicle on a highway in such a position that it obstructs a sidewalk, footpath, crosswalk or boulevard. The offence is complete upon the obstruction; intent is not required.',
  },
  {
    id: 'brampton-93-93-s8',
    bylaw: 'Traffic By-law 93-93',
    section: 's. 8(1)(b)',
    title: 'Parking within 3 metres of a fire hydrant',
    jurisdiction: 'brampton',
    category: 'parking',
    body: 'No person shall stop or park a vehicle within three metres of any fire hydrant. The hydrant must remain unobstructed at all times to permit emergency access.',
  },
  {
    id: 'brampton-174-81-s4',
    bylaw: 'Fire Routes By-law 174-81',
    section: 's. 4',
    title: 'Parking in a designated fire route',
    jurisdiction: 'brampton',
    category: 'parking',
    body: 'No person shall stop or park a vehicle in any portion of a designated fire route on private property. Fire routes must remain unobstructed at all times to permit unimpeded movement of fire department apparatus.',
  },
  {
    id: 'brampton-95-2017-s3',
    bylaw: 'Snow & Ice Removal By-law 95-2017',
    section: 's. 3',
    title: 'Interfering with snow clearing',
    jurisdiction: 'brampton',
    category: 'parking',
    body: 'No person shall stop, park or leave standing a vehicle on a highway in a manner that interferes with the City\'s snow clearing or salting operations during a declared significant weather event.',
  },
  {
    id: 'brampton-119-2019-s12',
    bylaw: 'Property Standards By-law 119-2019',
    section: 's. 12',
    title: 'Unsafe sleeping accommodation',
    jurisdiction: 'brampton',
    category: 'safety',
    body: 'Every dwelling unit shall be provided with rooms of sufficient size for the occupants, with adequate ventilation, light, and egress in case of fire. Sleeping rooms below grade must have a window or other approved means of escape directly to the outside.',
  },
  {
    id: 'brampton-119-2019-s8',
    bylaw: 'Property Standards By-law 119-2019',
    section: 's. 8',
    title: 'Ground cover and yard maintenance',
    jurisdiction: 'brampton',
    category: 'property',
    body: 'The owner of a property shall maintain the grounds in a condition that prevents soil erosion, the accumulation of debris, and the growth of weeds or grass exceeding 20 centimetres in height (other than ornamental plantings).',
  },
  {
    id: 'brampton-219-2018-s2',
    bylaw: 'Pool Enclosure By-law 219-2018',
    section: 's. 2',
    title: 'Pool enclosure requirements',
    jurisdiction: 'brampton',
    category: 'safety',
    body: 'Every owner of a privately-owned outdoor swimming pool shall enclose the pool with a fence at least 1.5 metres in height and equipped with self-closing, self-latching gates. The enclosure must be in place at all times the pool contains water deeper than 60 centimetres.',
  },
  {
    id: 'brampton-113-2024-s5',
    bylaw: 'Residential Rental Licensing By-law 113-2024',
    section: 's. 5',
    title: 'Licensing requirement for residential rental units',
    jurisdiction: 'brampton',
    category: 'rental',
    body: 'No person shall operate a residential rental unit within the City of Brampton without first obtaining and maintaining a valid licence under this by-law. The licence is held by the property owner and must be renewed annually.',
  },
  {
    id: 'brampton-92-2018-s7',
    bylaw: 'Vital Services By-law 92-2018',
    section: 's. 7',
    title: 'Provision of vital services to rental units',
    jurisdiction: 'brampton',
    category: 'safety',
    body: 'Every landlord shall ensure that heat, water, electricity, and fuel are supplied to a rented dwelling unit during the periods in which they are required under provincial standards. Failure to provide vital services is an offence regardless of the lease terms.',
  },
  {
    id: 'ontario-amps-o-reg-333-07-s3',
    bylaw: 'Ontario Regulation 333/07 (AMPS)',
    section: 's. 3',
    title: 'Screening Officer authority',
    jurisdiction: 'ontario',
    category: 'procedure',
    body: 'A Screening Officer designated by a municipality has the authority to extend the time for paying a penalty, cancel a penalty, or affirm a penalty in whole or in part. The officer\'s decision must be in writing and provided to the person who requested the screening.',
  },
  {
    id: 'ontario-amps-o-reg-333-07-s5',
    bylaw: 'Ontario Regulation 333/07 (AMPS)',
    section: 's. 5',
    title: 'Right to a hearing',
    jurisdiction: 'ontario',
    category: 'procedure',
    body: 'A person who has requested a screening and is not satisfied with the Screening Officer\'s decision may request a hearing before a Hearing Officer within 15 days of the decision date. The Hearing Officer is independent of the municipality.',
  },
  {
    id: 'ontario-amps-o-reg-333-07-s7',
    bylaw: 'Ontario Regulation 333/07 (AMPS)',
    section: 's. 7',
    title: 'Financial hardship considerations',
    jurisdiction: 'ontario',
    category: 'procedure',
    body: 'A Screening Officer may consider documented financial hardship as a basis for extending payment timelines or accepting a reduced amount under an instalment plan. Financial hardship alone is not, however, grounds for cancelling a penalty for a substantiated offence.',
  },
];

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was',
  'were', 'will', 'with', 'i', 'my', 'me', 'we', 'our', 'you', 'your',
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Token-overlap retrieval — deterministic, no embeddings, runs anywhere.
 * Production replaces this with Workers AI bge-m3 embeddings + Vectorize.
 * Same signature, same return type — the swap is a single import.
 */
export function searchBylaws(query: string, k = 4): Array<BylawChunk & { score: number }> {
  const qTokens = new Set(tokens(query));
  if (qTokens.size === 0) return [];

  const scored = BYLAW_CORPUS.map((chunk) => {
    const haystack = `${chunk.title} ${chunk.body} ${chunk.category} ${chunk.bylaw}`;
    const cTokens = tokens(haystack);
    let overlap = 0;
    for (const t of cTokens) if (qTokens.has(t)) overlap++;
    const score = overlap / Math.max(qTokens.size, 1);
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
