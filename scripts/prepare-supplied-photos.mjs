import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Full-resolution AI edit results stay in outputs; only responsive WebP is published.
const photos = [
  ['01', 'supplied-terrace-clean', ['Photo 1.jpg', 'Photo 10.jpg'], 'Sunset terrace beneath a timber pergola', 'Hero transition; Visual Journal image 3'],
  ['02', 'supplied-lounge-clean', ['Photo 2.jpg', 'Photo 9.jpg'], 'Open-air lounge and terrace at twilight', 'The Sanctuary; Visual Journal image 2'],
  ['03', 'supplied-residence-01-clean', ['Photo 3.jpg'], 'Sunlit terrace with curved steps and a bay view', 'The Residences image 1'],
  ['04', 'supplied-residence-02-clean', ['Photo 4.jpg'], 'Living room opening onto a terrace and the bay', 'The Residences image 2'],
  ['05', 'supplied-residence-03-clean', ['Photo 5.jpg'], 'Sea-facing bedroom with woven details', 'The Residences image 3'],
  ['06', 'supplied-residence-04-clean', ['Attachment 6, named Photo 7.jpg'], 'Evening lounge and open terrace', 'The Residences image 4'],
  ['07', 'supplied-residence-05-clean', ['Attachment 7, named Photo 7.jpg'], 'Infinity pool and sun loungers at dusk', 'The Residences image 5'],
  ['08', 'supplied-pool-aerial-clean', ['Photo 8.jpg'], 'Aerial pool study with parasols and limestone paving', 'Visual Journal image 1'],
];

await mkdir('public/images', { recursive: true });
const metadata = {};
const assets = [];
for (const [number, slug, source, description, placement] of photos) {
  const file = `outputs/replacement-photos/photo-${number}-clean.png`;
  const { width, height } = await sharp(file).metadata();
  if (!width || !height) throw new Error(`Image dimensions missing: ${file}`);
  metadata[slug] = { width, height };
  for (const target of [800, 1600, 2400]) {
    await sharp(file).rotate().resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 90, effort: 6 }).toFile(`public/images/${slug}-${target}.webp`);
  }
  assets.push({
    slug, file, source: `${source.join(' / ')} supplied by the portfolio owner on 23 October 2026`,
    description, placement, width, height, variants: [800, 1600, 2400],
    enhancement: 'Conservative AI-assisted cleanup using the built-in image_gen edit tool; responsive WebP conversion with Sharp.',
    usageNote: 'User-supplied photography, enhanced with AI for this independent portfolio study. Fine details may be interpreted by AI. Exact property and room-category attribution is not asserted. No official affiliation implied.',
  });
}
await writeFile('src/data/supplied-photo-metadata.json', `${JSON.stringify(metadata, null, 2)}\n`);
const manifest = JSON.parse(await readFile('public/asset-manifest.json', 'utf8'));
manifest.checkedAt = '2026-10-23';
manifest.globalNotice = 'Hero and selected editorial photographs were supplied by the portfolio owner and enhanced with AI. Remaining photography uses the Pexels License and retains source locations in the credits. Exact room categories are not attributed from supplied images. This is an independent portfolio concept.';
manifest.suppliedPhotography = assets;
await writeFile('public/asset-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ uniquePhotos: assets.length, placements: 10, metadata }, null, 2));
