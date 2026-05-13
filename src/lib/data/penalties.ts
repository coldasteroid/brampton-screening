// Brampton APS — Jan 2026 penalty schedule
// Source: Council amendments (Oct 2025), effective 2026-01-01
// https://councillorsantos.ca/amendments-to-administrative-penalty-system-penalties/

export type PenaltyTier = 'first' | 'second' | 'third';

export interface PenaltyCode {
  code: string;
  label: string;
  category: 'parking' | 'property' | 'rental' | 'safety';
  bylaw: string;
  amounts: Record<PenaltyTier, number>; // dollars
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  description: string;
}

export const PENALTIES: PenaltyCode[] = [
  {
    code: 'PARK-SIDEWALK',
    label: 'Obstructing Sidewalk',
    category: 'parking',
    bylaw: 'Traffic By-law 93-93 s.6(1)',
    amounts: { first: 50, second: 75, third: 100 },
    riskLevel: 'low',
    description:
      'A vehicle was parked in a way that blocked pedestrian movement on a public sidewalk. This creates a hazard for people using wheelchairs, strollers, or canes.',
  },
  {
    code: 'PARK-HYDRANT',
    label: 'Parking within 3m of a Fire Hydrant',
    category: 'parking',
    bylaw: 'Traffic By-law 93-93 s.8(1)(b)',
    amounts: { first: 100, second: 200, third: 300 },
    riskLevel: 'high',
    description:
      'A vehicle was parked within 3 metres of a fire hydrant. This obstructs emergency access during a fire and can cost lives.',
  },
  {
    code: 'PARK-FIRE-ROUTE',
    label: 'Parking in a Fire Route',
    category: 'parking',
    bylaw: 'Fire Routes By-law 174-81 s.4',
    amounts: { first: 150, second: 250, third: 350 },
    riskLevel: 'high',
    description:
      'A vehicle was parked in a designated fire route, which must remain clear for emergency vehicles at all times.',
  },
  {
    code: 'SNOW-CLEAR',
    label: 'Snow Clearing Interference',
    category: 'parking',
    bylaw: 'Snow & Ice Removal By-law 95-2017',
    amounts: { first: 250, second: 500, third: 750 },
    riskLevel: 'moderate',
    description:
      'A vehicle interfered with municipal snow clearing, delaying access for emergency services and residents.',
  },
  {
    code: 'PROP-MAINT',
    label: 'Ground Cover / Property Maintenance',
    category: 'property',
    bylaw: 'Property Standards By-law 119-2019',
    amounts: { first: 250, second: 500, third: 750 },
    riskLevel: 'moderate',
    description:
      'A property was not maintained to City standards (ground cover, vegetation, structural condition).',
  },
  {
    code: 'POOL-FENCE',
    label: 'Pool Fence Enclosure',
    category: 'safety',
    bylaw: 'Pool Enclosure By-law 219-2018',
    amounts: { first: 350, second: 700, third: 1000 },
    riskLevel: 'high',
    description:
      'A swimming pool was not properly enclosed. This is a child-drowning risk under provincial safety standards.',
  },
  {
    code: 'RENTAL-UNLIC',
    label: 'Operating Rental Without Licence',
    category: 'rental',
    bylaw: 'Residential Rental Licensing By-law 113-2024',
    amounts: { first: 750, second: 1100, third: 1500 },
    riskLevel: 'severe',
    description:
      'A residential rental unit was operated without registering for the City\'s Rental Licensing Program.',
  },
  {
    code: 'OCCUPANCY',
    label: 'Occupancy Standards (unsafe sleeping)',
    category: 'safety',
    bylaw: 'Property Standards By-law 119-2019 s.12',
    amounts: { first: 1000, second: 1250, third: 1500 },
    riskLevel: 'severe',
    description:
      'A residential unit had unsafe sleeping conditions (illegal basement conversions, blocked egress, inadequate ventilation).',
  },
  {
    code: 'VITAL-SERV',
    label: 'Vital Services (heat/water)',
    category: 'safety',
    bylaw: 'Vital Services By-law 92-2018',
    amounts: { first: 350, second: 700, third: 1000 },
    riskLevel: 'high',
    description:
      'A landlord failed to provide vital services (heat, water, fuel) required by City by-law.',
  },
];

export function findPenalty(code: string): PenaltyCode | undefined {
  return PENALTIES.find((p) => p.code === code);
}

export function tierFromAmount(p: PenaltyCode, dollars: number): PenaltyTier {
  if (dollars >= p.amounts.third) return 'third';
  if (dollars >= p.amounts.second) return 'second';
  return 'first';
}
