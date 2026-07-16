#!/usr/bin/env node
/**
 * scripts/update-version.cjs
 *
 * Reads the current version from package.json and updates the version badge
 * in public/index.html. Called automatically by release-it's `after:bump`
 * hook so every new release is reflected in the frontend footer.
 */

'use strict';

const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const ROOT = resolve(__dirname, '..');

// Read the bumped version from package.json
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const newVersion = `v${pkg.version}`;

const htmlPath = resolve(ROOT, 'public', 'index.html');
let html = readFileSync(htmlPath, 'utf8');

// Replace the version text inside the .version-badge span (after the SVG icon)
const updated = html.replace(
  /(<span class="version-badge">[\s\S]*?<\/svg>\s*)(v\d+\.\d+\.\d+)(\s*<\/span>)/,
  (_match, before, oldVersion, after) => {
    if (oldVersion === newVersion) return _match; // already up to date
    return `${before}${newVersion}${after}`;
  }
);

if (updated === html) {
  // Check whether it was already up to date or truly not found
  if (html.includes(newVersion)) {
    console.log(`[update-version] ✓  index.html already shows ${newVersion} — no changes needed.`);
  } else {
    console.warn('[update-version] ⚠️  Version badge not found in index.html.');
  }
  process.exit(0);
}

writeFileSync(htmlPath, updated, 'utf8');
console.log(`[update-version] ✅  index.html updated → ${newVersion}`);
