#!/usr/bin/env node
// Fixes two issues in the @next-community/adapter-vercel config.json:
// 1. Removes the blocking {"src":"/.*","status":404} route in the resource phase
// 2. Adds explicit pre-filesystem routes for dynamic pages to guarantee they reach their function
const fs = require('fs')
const path = require('path')

const cwd = process.cwd()
const configPath = path.join(cwd, '.next', 'output', 'config.json')

console.log('[patch-vercel-config] cwd:', cwd)
console.log('[patch-vercel-config] VERCEL env:', process.env.VERCEL)
console.log('[patch-vercel-config] config exists:', fs.existsSync(configPath))

if (!fs.existsSync(configPath)) {
  console.error('[patch-vercel-config] ERROR: config.json not found')
  process.exit(1)
}

const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const before = cfg.routes.length

// Fix 1: Remove the blocking route between handle:resource and handle:miss
cfg.routes = cfg.routes.filter(r => !(
  r.src === '/.*' &&
  r.status === 404 &&
  !r.continue &&
  !r.dest
))
console.log(`[patch-vercel-config] Removed ${before - cfg.routes.length} blocking route(s)`)

// Fix 2: Insert direct function routes BEFORE handle:filesystem
// These bypass the problematic check:true rewrite behavior
const directRoutes = [
  // /games/[id]
  {
    src: '^/games/([^/]+)/?$',
    dest: '/games/[id]?nxtPid=$1',
    headers: { 'x-matched-path': '/games/[id]' },
  },
  // /games/[id]/hand/[n]/trump
  {
    src: '^/games/([^/]+)/hand/([^/]+)/trump/?$',
    dest: '/games/[id]/hand/[n]/trump?nxtPid=$1&nxtPn=$2',
    headers: { 'x-matched-path': '/games/[id]/hand/[n]/trump' },
  },
  // /games/[id]/hand/[n]/roem
  {
    src: '^/games/([^/]+)/hand/([^/]+)/roem/?$',
    dest: '/games/[id]/hand/[n]/roem?nxtPid=$1&nxtPn=$2',
    headers: { 'x-matched-path': '/games/[id]/hand/[n]/roem' },
  },
  // /games/[id]/hand/[n]/score
  {
    src: '^/games/([^/]+)/hand/([^/]+)/score/?$',
    dest: '/games/[id]/hand/[n]/score?nxtPid=$1&nxtPn=$2',
    headers: { 'x-matched-path': '/games/[id]/hand/[n]/score' },
  },
  // /sessions/[id]
  {
    src: '^/sessions/([^/]+)/?$',
    dest: '/sessions/[id]?nxtPid=$1',
    headers: { 'x-matched-path': '/sessions/[id]' },
  },
]

// Find the position of handle:filesystem and insert before it
const fsIdx = cfg.routes.findIndex(r => r.handle === 'filesystem')
if (fsIdx >= 0) {
  cfg.routes.splice(fsIdx, 0, ...directRoutes)
  console.log(`[patch-vercel-config] Inserted ${directRoutes.length} direct function routes before filesystem`)
} else {
  // Fallback: prepend
  cfg.routes.unshift(...directRoutes)
  console.log(`[patch-vercel-config] WARNING: handle:filesystem not found, prepended routes`)
}

fs.writeFileSync(configPath, JSON.stringify(cfg))
console.log(`[patch-vercel-config] Total routes: ${cfg.routes.length}`)

// Copy to /vercel/output (the Vercel Build Output API directory)
const src = path.join(cwd, '.next', 'output')
const dest = process.env.VERCEL ? '/vercel/output' : path.join(cwd, '.vercel', 'output')

console.log(`[patch-vercel-config] Copying ${src} → ${dest}`)
try {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true, dereference: true })
  console.log('[patch-vercel-config] Done.')
} catch (e) {
  console.error('[patch-vercel-config] Copy failed:', e.message)
  process.exit(1)
}
