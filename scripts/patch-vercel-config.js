#!/usr/bin/env node
// Removes the blocking wildcard 404 route that the Next.js community adapter generates
// in the "resource" phase. Without this, all dynamic routes return 404 on Vercel.
// See: @next-community/adapter-vercel dist/index.js line ~11095
const fs = require('fs')
const path = require('path')

const configPath = path.join(process.cwd(), '.next', 'output', 'config.json')

if (!fs.existsSync(configPath)) {
  console.error('[patch-vercel-config] ERROR: config.json not found at', configPath)
  process.exit(1)
}

const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const before = cfg.routes.length

// Remove the blocking route: {"src":"/.*","status":404} between handle:resource and handle:miss
// This route blocks ALL dynamic routes from reaching the rewrite phase
cfg.routes = cfg.routes.filter(r => !(
  r.src === '/.*' &&
  r.status === 404 &&
  !r.continue &&
  !r.dest
))

const removed = before - cfg.routes.length
console.log(`[patch-vercel-config] Removed ${removed} blocking route(s) from config.json (${before} → ${cfg.routes.length})`)

if (removed === 0) {
  console.warn('[patch-vercel-config] WARNING: expected to remove 1 route but removed 0 — check adapter output')
}

fs.writeFileSync(configPath, JSON.stringify(cfg))

// Copy to /vercel/output (the Vercel Build Output API directory)
if (process.env.VERCEL) {
  const src = path.join(process.cwd(), '.next', 'output')
  const dest = '/vercel/output'
  console.log(`[patch-vercel-config] Copying ${src} → ${dest}`)
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true, dereference: true })
  console.log('[patch-vercel-config] Done.')
}
