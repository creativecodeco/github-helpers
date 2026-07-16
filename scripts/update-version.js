#!/usr/bin/env node
/**
 * update-version.js
 *
 * Reads the current version from package.json and updates the version badge
 * in public/index.html. This script is called automatically by the
 * release-it hook `after:bump` so that every new release is reflected
 * in the frontend footer without any manual editing.
 *
 * Usage (called automatically by release-it):
 *   node scripts/update-version.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Read the new version from package.json (already bumped by release-it at this point)
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const newVersion = `v${pkg.version}`;

// Update public/index.html — replace the inline version text inside the badge
// The badge text follows the closing </svg> tag directly, e.g.:
//   </svg>
//             v1.0.0
const htmlPath = resolve(ROOT, 'public', 'index.html');
let html = readFileSync(htmlPath, 'utf8');

// Replace any semver string preceded by whitespace inside the version-badge span
const versionPattern = /(class="version-badge"[\s\S]*?<\/svg>\s*)(v\d+\.\d+\.\d+)/;
const updated = html.replace(versionPattern, (match, before, _oldVersion) => {
  return `${before}${newVersion}`;
});

if (updated === html) {
  console.warn('[update-version] ⚠️  No version badge found in index.html — check the pattern.');
  process.exit(0);
}

writeFileSync(htmlPath, updated, 'utf8');
console.log(`[update-version] ✅  index.html updated → ${newVersion}`);
