import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function tryReadPolicyFile(fileName: string): string[] | null {
  try {
    const filePath = path.join(process.cwd(), '..', 'policy models', fileName)
    const buffer = fs.readFileSync(filePath)
    if (buffer.length === 0) return null
    let content: string
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) content = buffer.toString('utf16le')
    else if (buffer[0] === 0xFE && buffer[1] === 0xFF) content = buffer.slice(2).swap16().toString('utf16le')
    else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) content = buffer.slice(3).toString('utf-8')
    else content = buffer.toString('utf-8')
    content = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    return content.split('\n')
  } catch {
    return null
  }
}

// Fallback submodel options when file data is unavailable
const FALLBACK_SUBMODELS = [
  { code: '1', label: 'STANDARD' },
  { code: '2', label: 'DELUXE' },
  { code: '3', label: 'SPORT' },
  { code: '4', label: 'PREMIUM' },
  { code: '999', label: 'VARIOUS' },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get('vehicleType')
    const makeCode = searchParams.get('makeCode')
    const modelCode = searchParams.get('modelCode')
    const bodyTypeCode = searchParams.get('bodyTypeCode')
    const year = searchParams.get('year')
    if (!vehicleType || !makeCode || !modelCode || !bodyTypeCode || !year) {
      return NextResponse.json({ success: false, error: 'All params required' }, { status: 400 })
    }

    // Try to read from file first
    const lines = tryReadPolicyFile('MotorSubModel')
    if (lines) {
      const dataStart = lines.findIndex(l => /^\d+\t/.test(l.trim()))
      if (dataStart !== -1) {
        const submodels: { code: string; label: string }[] = []
        const seen = new Set<string>()
        for (let i = dataStart; i < lines.length; i++) {
          const line = lines[i]; if (!line) continue
          const parts = line.split('\t')
          if (parts.length < 8) continue
          const vType = parts[1]?.trim()
          const mCode = parts[2]?.trim()
          const mdCode = parts[3]?.trim()
          const btCode = parts[4]?.trim()
          const yr = parts[5]?.trim()
          const smCode = parts[6]?.trim()
          const smDesc = parts[7]?.trim()
          if (!smCode || !smDesc || smCode === 'IMOSubModelCode') continue
          if (vType !== vehicleType || mCode !== makeCode || mdCode !== modelCode || btCode !== bodyTypeCode || yr !== year) continue
          if (!seen.has(smCode)) { seen.add(smCode); submodels.push({ code: smCode, label: smDesc }) }
        }
        if (submodels.length > 0) {
          submodels.sort((a, b) => a.label.localeCompare(b.label))
          return NextResponse.json({ success: true, data: submodels })
        }
      }
    }

    // Fallback to static options
    return NextResponse.json({ success: true, data: FALLBACK_SUBMODELS })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
