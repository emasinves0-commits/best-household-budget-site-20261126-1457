// HomeLedger hand-in driver (Node 22, standard library only).
//
// The site is the static app/ folder beside this file: plain HTML, CSS and
// ES modules that open in a browser with no build step and no network. This
// program hands it in: it copies app/ and screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun library,
// so the judge reads exactly the site as built.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (from the kit's gate): the text cap shapes the
// dossier's bytes; the others refuse an entry the scorer would refuse —
// more than 4 screenshots or one over 256 KiB, more than 993 files and
// directories in app/ or 16 MiB of app files. app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_LIMITS));

// A one-line receipt on stdout so a local run shows what was handed in.
// (The grader reads the files, not this line.)
const shotCount = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')).length : 0;
console.log(`HomeLedger handed in: app/ + ${shotCount} screenshot(s) + dossier.json -> ${out}`);
