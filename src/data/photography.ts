import supplied from './supplied-photo-metadata.json';

const originalDimensions: Record<string, [number, number]> = {
  hero: [2400, 1350], coast: [2400, 3200], suite: [2400, 3200],
  terrace: [2400, 1600], spa: [2000, 2667], dining: [2400, 3600],
  food: [2000, 1333], sunset: [2400, 1595], olive: [2000, 1335],
  kayak: [2000, 3563], 'suite-wide': [2400, 1602],
  'suite-view': [2400, 3200], 'pool-villa': [2400, 1600],
};

export function photoDimensions(image: string): [number, number] {
  const replacement = (supplied as Record<string, { width: number; height: number }>)[image];
  return replacement ? [replacement.width, replacement.height] : originalDimensions[image] ?? [2400, 1600];
}

export function photoSrcSet(image: string, base: string, maximum = 2400): string {
  const [width] = photoDimensions(image);
  const seen = new Set<number>();
  return [800, 1600, 2400].filter(size => size <= maximum).flatMap(size => {
    const actual = Math.min(size, width);
    if (seen.has(actual)) return [];
    seen.add(actual);
    return [`${base}${image}-${size}.webp ${actual}w`];
  }).join(', ');
}

export const visualJournal = [
  { image: 'supplied-pool-aerial-clean', caption: 'The water, the light', location: 'SUPPLIED PHOTOGRAPHY · AI-ENHANCED' },
  { image: 'supplied-lounge-clean', caption: 'Softness in the details', location: 'SUPPLIED PHOTOGRAPHY · AI-ENHANCED' },
  { image: 'supplied-terrace-clean', caption: 'A terrace at golden hour', location: 'SUPPLIED PHOTOGRAPHY · AI-ENHANCED' },
  { image: 'spa', caption: 'A moment, entirely yours', location: 'ILLUSTRATIVE WELLNESS INTERIOR' },
  { image: 'dining', caption: 'An invitation to linger', location: 'SPAIN · ILLUSTRATIVE DINING' },
  { image: 'sunset', caption: 'Nothing more to do', location: 'ES VEDRÀ, IBIZA' },
];
