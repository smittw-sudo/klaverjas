#!/usr/bin/env node
// Removes the blocking wildcard 404 route that the Next.js community adapter generates
// in the "resource" phase. Without this, all dynamic routes return 404 on Vercel.
// See: @next-community/adapter-vercel dist/index.js line ~11095
const fs = require('fs')
const path = require('path')

const cwd = process.cwd()
const configPath = path.join(cwd, '.next', 'output', 'config.json')

console.log('[patch-vercel-config] cwd:', cwd)
console.log('[patch-vercel-config] VERCEL env:', process.env.VERCEL)
console.log('[patch-vercel-config] config path:', configPath)
console.log('[patch-vercel-config] config exists:', fs.existsSync(configPath))

if (!fs.existsSync(configPath)) {
  console.error('[patch-vercel-config] ERROR: config.json not found — cannot patch')
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
console.log(`[patch-vercel-config] Removed ${removed} blocking route(s) (${before} → ${cfg.routes.length})`)

if (removed === 0) {
  console.warn('[patch-vercel-config] WARNING: removed 0 routes — adapter output may have changed')
}

fs.writeFileSync(configPath, JSON.stringify(cfg))

// Copy to /vercel/output (the Vercel Build Output API directory)
const src = path.join(cwd, '.next', 'output')
const dest = process.env.VERCEL ? '/vercel/output' : path.join(cwd, '.vercel', 'output')

console.log(`[patch-vercel-config] Copying ${src} → ${dest}`)
try {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true, dereference: true })
  console.log('[patch-vercel-config] Copy complete. Files:', fs.readdirSync(dest).join(', '))
} catch (e) {
  console.error('[patch-vercel-config] Copy failed:', e.message)
  process.exit(1)
}
