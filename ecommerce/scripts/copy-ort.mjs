/**
 * Copies the ONNX Runtime WASM and worker files from onnxruntime-web into
 * public/ort/ so they are served from the same origin at runtime.
 *
 * Run automatically via the "postinstall" npm script, or manually:
 *   node scripts/copy-ort.mjs
 *
 * The files must match the exact version of onnxruntime-web that is installed
 * (check with: npm ls onnxruntime-web).
 */

import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// onnxruntime-web 1.22+ nests its dist under node_modules/onnxruntime-web/dist
const src = join(root, 'node_modules', 'onnxruntime-web', 'dist')
const dest = join(root, 'public', 'ort')

if (!existsSync(src)) {
  console.error(`[copy-ort] Source not found: ${src}`)
  console.error('[copy-ort] Run: npm install --legacy-peer-deps')
  process.exit(1)
}

mkdirSync(dest, { recursive: true })

let copied = 0
for (const f of readdirSync(src)) {
  const isWasm = f.endsWith('.wasm')
  // Only the ort-wasm-simd-threaded .mjs companion files are needed for the worker
  const isOrtMjs = f.startsWith('ort-wasm') && f.endsWith('.mjs')

  if (isWasm || isOrtMjs) {
    cpSync(join(src, f), join(dest, f))
    console.log(`[copy-ort] Copied ${f}`)
    copied++
  }
}

console.log(`[copy-ort] Done — ${copied} file(s) copied to public/ort/`)
