#!/usr/bin/env node
/**
 * Heuristic: files in src/ and app/ not targeted by any static import from the same trees.
 * Misses: dynamic import(), require(variable), native/web resolution.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function walk(dir, acc = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  const skip = new Set(['node_modules', '.git', 'dist', 'build', 'ios', 'android', '.expo', 'scripts'])
  for (const e of entries) {
    if (skip.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) acc.push(p)
  }
  return acc
}

const files = walk(path.join(root, 'src')).concat(walk(path.join(root, 'app')))
const fileSet = new Set(files.map((f) => path.normalize(f)))

function resolveImport(spec, fromFile) {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return null
  let base
  if (spec.startsWith('@/')) {
    base = path.join(root, spec.slice(2))
  } else {
    base = path.resolve(path.dirname(fromFile), spec)
  }
  const candidates = [
    base,
    base + '.ts',
    base + '.tsx',
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]
  for (const c of candidates) {
    const n = path.normalize(c)
    if (fs.existsSync(n) && fs.statSync(n).isFile()) return n
  }
  return null
}

const importRe = /\bfrom\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g
const referenced = new Set()

for (const f of files) {
  const rel = f.slice(root.length + 1)
  if (rel.startsWith('app' + path.sep) || rel === path.join('app', '_layout.tsx') || rel.startsWith('app\\'))
    referenced.add(f)
  const base = path.basename(f)
  if (base === '_layout.tsx' || base === 'index.tsx' || base === '+html.tsx' || base === '+not-found.tsx')
    referenced.add(f)
}

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8')
  let m
  importRe.lastIndex = 0
  while ((m = importRe.exec(content)) !== null) {
    const spec = m[1] || m[2]
    const resolved = resolveImport(spec, f)
    if (resolved && fileSet.has(path.normalize(resolved))) referenced.add(path.normalize(resolved))
  }
}

// store/index often re-exports — any import from '@/src/store' still resolves to store/index.ts
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8')
  if (content.includes("from '@/src/store'") || content.includes('from "../store"') || content.includes("from '@/src/store/index'")) {
    const idx = path.join(root, 'src', 'store', 'index.ts')
    if (fileSet.has(idx)) referenced.add(path.normalize(idx))
  }
}

const unused = files.filter((f) => !referenced.has(f))

function stripComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim()
}

const commentHeavy = []
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8')
  const stripped = stripComments(raw).replace(/\s+/g, ' ')
  if (stripped.length < 8) commentHeavy.push({ f, len: stripped.length })
}

console.log('=== Unused by static import graph (src + app) ===\n')
for (const f of unused.sort()) {
  console.log(f.replace(root + path.sep, ''))
}

console.log('\n=== Files with almost no code after comment strip (len < 8 chars) ===\n')
for (const { f, len } of commentHeavy.sort((a, b) => a.f.localeCompare(b.f))) {
  console.log(f.replace(root + path.sep, ''), `(~${len} chars)`)
}
