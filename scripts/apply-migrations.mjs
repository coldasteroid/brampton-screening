#!/usr/bin/env node
/**
 * Apply every migration in ./migrations to the FairPlan D1 database.
 *
 *   node scripts/apply-migrations.mjs --local
 *   node scripts/apply-migrations.mjs --remote
 *
 * Migrations run in lexical order. Wrangler's IF NOT EXISTS / OR REPLACE
 * statements keep re-runs idempotent.
 */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir = join(root, 'migrations');
const target = process.argv.includes('--remote') ? '--remote' : '--local';

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('No migration files found in ./migrations');
  process.exit(1);
}

console.log(`Applying ${files.length} migration(s) ${target} → fairplan-db`);

for (const file of files) {
  console.log(`\n— ${file}`);
  const filePath = join(migrationsDir, file);
  const quoted = process.platform === 'win32' ? `"${filePath}"` : filePath;
  const args = ['wrangler', 'd1', 'execute', 'fairplan-db', target, `--file=${quoted}`];
  const result = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`✖ ${file} failed`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n✓ All migrations applied');
