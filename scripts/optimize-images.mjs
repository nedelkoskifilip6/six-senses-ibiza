import sharp from 'sharp';
import {readFile,mkdir,stat} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('public/asset-manifest.json','utf8'));
await mkdir('public/images',{recursive:true});
const used = new Set(['hero','coast','suite','terrace','spa','dining','food','sunset','olive','kayak','suite-wide','suite-view','pool-villa']);
manifest.assets = manifest.assets.filter(asset => used.has(asset.slug));
for(const asset of manifest.assets){
  for(const width of [800,1600,2400]){
    await sharp(asset.file).rotate().resize({width,withoutEnlargement:true}).webp({quality:width===800?76:80,effort:5}).toFile(`public/images/${asset.slug}-${width}.webp`);
  }
}
for (const asset of manifest.heroPhotography ?? []) {
  for (const width of asset.variants) {
    await sharp(asset.file).rotate().resize({width,withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(`public/images/${asset.slug}-${width}.webp`);
  }
}
const sizes=await Promise.all(manifest.assets.map(async a=>({image:a.slug,kb:Math.round((await stat(`public/images/${a.slug}-1600.webp`)).size/1024)})));
console.log(JSON.stringify(sizes));
