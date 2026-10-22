#!/usr/bin/env node
/**
 * Check the published artifact, independent of its source implementation.
 * Usage: node scripts/verify-build.mjs [dist-directory] [--external]
 * --external additionally makes HEAD requests to official Six Senses links.
 */
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, process.argv.slice(2).find(arg => !arg.startsWith('--')) || 'dist');
const base = '/six-senses-ibiza/';
const origin = 'https://nedelkoskifilip6.github.io';
const problems = [];
const warnings = [];
const references = [];
const external = new Set();
const documents = new Map();

function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return number <= 0x10ffff ? String.fromCodePoint(number) : '\uFFFD';
  });
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(name) : [name];
  }));
  return results.flat();
}

// Tokenize real HTML attributes, leaving serialized React/Astro props untouched.
// Quoted attribute values can contain angle brackets, so splitting on '>' is unsafe.
function tags(html) {
  const found = [];
  let at = 0;
  while ((at = html.indexOf('<', at)) !== -1) {
    if (html.startsWith('<!--', at)) {
      const end = html.indexOf('-->', at + 4);
      at = end === -1 ? html.length : end + 3;
      continue;
    }
    const start = at++;
    const nameMatch = /^[a-z][a-z\d:-]*/i.exec(html.slice(at));
    if (!nameMatch) continue;
    const name = nameMatch[0].toLowerCase();
    at += nameMatch[0].length;
    const attrs = new Map();
    while (at < html.length) {
      while (/\s/.test(html[at] || '')) at++;
      if (html[at] === '>') { at++; break; }
      if (html[at] === '/' && html[at + 1] === '>') { at += 2; break; }
      const attribute = /^[^\s=/>]+/.exec(html.slice(at));
      if (!attribute) { at++; continue; }
      const key = attribute[0].toLowerCase();
      at += attribute[0].length;
      while (/\s/.test(html[at] || '')) at++;
      let value = '';
      if (html[at] === '=') {
        at++;
        while (/\s/.test(html[at] || '')) at++;
        const quote = html[at] === '"' || html[at] === "'" ? html[at++] : null;
        const valueStart = at;
        if (quote) {
          while (at < html.length && html[at] !== quote) at++;
          value = html.slice(valueStart, at++);
        } else {
          while (at < html.length && !/[\s>]/.test(html[at])) at++;
          value = html.slice(valueStart, at);
        }
      }
      attrs.set(key, decode(value));
    }
    const tag = { name, attrs, offset: start };
    found.push(tag);
    if (name === 'script' || name === 'style' || name === 'textarea' || name === 'title') {
      const end = html.toLowerCase().indexOf(`</${name}`, at);
      if (name === 'style') tag.css = html.slice(at, end < 0 ? html.length : end);
      at = end < 0 ? html.length : html.indexOf('>', end) + 1;
    }
  }
  return found;
}

function publicPath(file) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  return base + (relative.endsWith('index.html') ? relative.slice(0, -10) : relative);
}

function addReference(value, file, attribute, anchor = false) {
  value = value.trim();
  if (!value || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) return;
  let url;
  try { url = new URL(value, origin + publicPath(file)); }
  catch { problems.push({ file: path.relative(root, file), reference: value, issue: 'Malformed URL' }); return; }
  if (url.origin !== origin) {
    if (url.protocol === 'https:' || url.protocol === 'http:') external.add(url.href);
    return;
  }
  if (!url.pathname.startsWith(base)) {
    problems.push({ file: path.relative(root, file), reference: value, issue: `Local URL escapes GitHub Pages base ${base}` });
    return;
  }
  references.push({ url, file, value, attribute, anchor });
}

function scanCss(css, file) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
    addReference(match[1] ?? match[2] ?? match[3], file, 'CSS url()');
  }
  for (const match of source.matchAll(/@import\s+(?:"([^"]+)"|'([^']+)')/gi)) {
    addReference(match[1] ?? match[2], file, 'CSS @import');
  }
}

let files;
try { files = await filesUnder(dist); }
catch (error) { console.error(`Cannot read build directory ${dist}: ${error.message}`); process.exit(1); }

const htmlFiles = files.filter(file => file.endsWith('.html'));
const cssFiles = files.filter(file => file.endsWith('.css'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const parsed = tags(html);
  const ids = new Set();
  for (const { name, attrs, css } of parsed) {
    if (attrs.has('id')) {
      const id = attrs.get('id');
      if (ids.has(id)) problems.push({ file: path.relative(root, file), reference: id, issue: 'Duplicate HTML id' });
      ids.add(id);
    }
    if (name === 'a' && attrs.has('name')) ids.add(attrs.get('name'));
    for (const attribute of ['href', 'src', 'poster', 'component-url', 'renderer-url']) {
      if (attrs.has(attribute)) addReference(attrs.get(attribute), file, attribute, attribute === 'href' && (name === 'a' || name === 'area'));
    }
    if (attrs.has('srcset')) {
      for (const candidate of attrs.get('srcset').split(',')) {
        const candidateUrl = candidate.trim().split(/\s+/)[0];
        if (candidateUrl) addReference(candidateUrl, file, 'srcset');
      }
    }
    if (attrs.has('style')) scanCss(attrs.get('style'), file);
    if (css) scanCss(css, file);
  }
  documents.set(path.resolve(file), ids);
}
for (const file of cssFiles) scanCss(await readFile(file, 'utf8'), file);

const verifiedResources = new Set();
const verifiedAnchors = new Set();
for (const { url, file, value, attribute, anchor } of references) {
  let relative;
  try { relative = decodeURIComponent(url.pathname.slice(base.length)); }
  catch { problems.push({ file: path.relative(root, file), reference: value, issue: 'Malformed URL encoding' }); continue; }
  let target = path.resolve(dist, relative);
  if (target !== dist && !target.startsWith(dist + path.sep)) {
    problems.push({ file: path.relative(root, file), reference: value, issue: 'Path traverses outside build' });
    continue;
  }
  let info;
  try {
    info = await stat(target);
    if (info.isDirectory()) { target = path.join(target, 'index.html'); info = await stat(target); }
  } catch {
    problems.push({ file: path.relative(root, file), reference: value, attribute, issue: 'Local resource does not exist' });
    continue;
  }
  if (!info.isFile()) problems.push({ file: path.relative(root, file), reference: value, issue: 'Local resource is not a file' });
  verifiedResources.add(path.relative(dist, target));
  if (anchor && url.hash && url.hash !== '#') {
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); }
    catch { problems.push({ file: path.relative(root, file), reference: value, issue: 'Malformed anchor encoding' }); continue; }
    const ids = documents.get(target);
    if (ids && !ids.has(id)) problems.push({ file: path.relative(root, file), reference: value, issue: `Missing internal anchor #${id}` });
    else if (ids) verifiedAnchors.add(`${publicPath(target)}#${id}`);
  }
}

for (const expected of ['index.html', 'credits/index.html']) {
  if (!documents.has(path.join(dist, expected))) problems.push({ file: expected, issue: 'Required published page is absent' });
}

const externalResults = [];
if (process.argv.includes('--external')) {
  const official = [...external].filter(url => new URL(url).hostname === 'www.sixsenses.com');
  await Promise.all(official.map(async url => {
    try {
      let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (response.status === 405 || response.status === 501) response = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      externalResults.push({ url, status: response.status, finalURL: response.url });
      if (!response.ok) warnings.push({ reference: url, issue: `Official external URL returned HTTP ${response.status}` });
      await response.body?.cancel();
    } catch (error) {
      externalResults.push({ url, error: error.message });
      warnings.push({ reference: url, issue: 'External URL could not be verified in this environment' });
    }
  }));
}

const report = {
  checkedAt: new Date().toISOString(),
  buildDirectory: path.relative(root, dist),
  base,
  result: problems.length ? 'failed' : 'passed',
  htmlFiles: htmlFiles.length,
  cssFiles: cssFiles.length,
  localReferencesChecked: references.length,
  uniqueLocalResources: verifiedResources.size,
  uniqueInternalAnchors: verifiedAnchors.size,
  externalURLsFound: external.size,
  externalResults,
  problems,
  warnings,
};
await mkdir(path.join(root, 'work'), { recursive: true });
await writeFile(path.join(root, 'work/link-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.result.toUpperCase()}: ${htmlFiles.length} HTML pages, ${cssFiles.length} CSS files, ${references.length} local references, ${verifiedResources.size} resources, ${verifiedAnchors.size} internal anchors.`);
for (const issue of problems) console.error(`ERROR ${issue.file}: ${issue.issue} — ${issue.reference || ''}`);
for (const issue of warnings) console.warn(`WARNING ${issue.issue} — ${issue.reference || ''}`);
console.log(`Report: ${path.relative(root, path.join(root, 'work/link-check.json'))}`);
process.exitCode = problems.length ? 1 : 0;
