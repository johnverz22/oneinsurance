const fs = require('fs')
const path = require('path')

// Copy ONNX Runtime WASM files to public directory
const sourceDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'onnxruntime-web',
  'dist'
)
const targetDir = path.join(__dirname, '..', 'public', 'wasm')

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Copy WASM files
const wasmFiles = [
  'ort-wasm.wasm',
  'ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm',
  'ort-wasm-simd-threaded.wasm',
]

wasmFiles.forEach((file) => {
  const source = path.join(sourceDir, file)
  const target = path.join(targetDir, file)

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target)
    console.log(`Copied ${file} to public/wasm/`)
  } else {
    console.warn(`Warning: ${file} not found in source directory`)
  }
})

console.log('ONNX Runtime WASM files copied successfully!')
