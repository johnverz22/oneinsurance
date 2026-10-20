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

// Fallback model data for common makes when file is unavailable
// Key: `${vehicleType}_${makeCode}` -> models
const FALLBACK_MODELS: Record<string, { code: string; label: string }[]> = {
  // Honda Motorcycle
  'MOTORCYCLE_3': [
    { code: '1', label: 'AME' }, { code: '2', label: 'BEAT' }, { code: '3', label: 'BRAVO' },
    { code: '4', label: 'SCOOPY' }, { code: '5', label: 'WAVE' }, { code: '6', label: 'XRM' },
    { code: '7', label: 'ZOOMER X' }, { code: '17', label: 'TMX' }, { code: '18', label: 'DREAM' },
    { code: '19', label: 'CB' }, { code: '25', label: 'CGX' }, { code: '26', label: 'XR' },
    { code: '27', label: 'RS' }, { code: '28', label: 'SR' }, { code: '29', label: 'CBR' },
    { code: '30', label: 'DASH' }, { code: '31', label: 'ALPHA' }, { code: '32', label: 'PACIFIC COAST' },
    { code: '33', label: 'CLICK' }, { code: '34', label: 'XLR' }, { code: '35', label: 'C' },
    { code: '36', label: 'ST' }, { code: '37', label: 'ENDURO' }, { code: '38', label: 'BROS' },
    { code: '39', label: 'XL' }, { code: '40', label: 'CRF' }, { code: '41', label: 'CG' },
    { code: '42', label: 'BLAZE' }, { code: '44', label: 'DS' }, { code: '45', label: 'VFR' },
    { code: '46', label: 'GL' }, { code: '48', label: 'ZN' }, { code: '50', label: 'VT' },
    { code: '51', label: 'TRX' }, { code: '52', label: 'GIORNO' }, { code: '53', label: 'ATV' },
    { code: '56', label: 'DIO' }, { code: '57', label: 'REBEL' }, { code: '58', label: 'GOLDWING' },
    { code: '59', label: 'X-ADV' }, { code: '60', label: 'MC' }, { code: '61', label: 'AFRICA' },
    { code: '63', label: 'PCX' }, { code: '64', label: 'MAGNA' }, { code: '65', label: 'ANP' },
    { code: '66', label: 'SHADOW' }, { code: '67', label: 'FUSION' }, { code: '68', label: 'LEAD' },
    { code: '69', label: 'CT' }, { code: '70', label: 'FS' }, { code: '72', label: 'GENIO' },
    { code: '73', label: 'DAZZLER' }, { code: '74', label: 'CM' }, { code: '75', label: 'ADV' },
    { code: '77', label: 'AIRBLADE' }, { code: '79', label: 'SUPRA' }, { code: '80', label: 'KRS' },
    { code: '81', label: 'CL' }, { code: '82', label: 'SUPER CUB' }, { code: '83', label: 'PS' },
    { code: '85', label: 'WINNER X' }, { code: '999', label: 'VARIOUS' },
  ],
  // Suzuki Motorcycle
  'MOTORCYCLE_8': [
    { code: '1', label: 'NEX' }, { code: '2', label: 'SKYDRIVE' }, { code: '15', label: 'SMASH' },
    { code: '16', label: 'RAIDER' }, { code: '17', label: 'HAYATE' }, { code: '18', label: 'SHOGUN' },
    { code: '19', label: 'THUNDER' }, { code: '20', label: 'AX4' }, { code: '21', label: 'X4' },
    { code: '22', label: 'MOLA' }, { code: '23', label: 'MOLA' }, { code: '25', label: 'GD' },
    { code: '26', label: 'GS' }, { code: '27', label: 'FD' }, { code: '30', label: 'DR' },
    { code: '31', label: 'SHOOTER' }, { code: '32', label: 'X3' }, { code: '33', label: 'GLADIUS' },
    { code: '35', label: 'GSX-R' }, { code: '36', label: 'STEP' }, { code: '40', label: 'V-STROM' },
    { code: '42', label: 'X' }, { code: '43', label: 'GIXXER' }, { code: '45', label: 'ADDRESS' },
    { code: '47', label: 'EN' }, { code: '48', label: 'B' }, { code: '49', label: 'CRYSTAL' },
    { code: '50', label: 'TS' }, { code: '51', label: 'GSX-S' }, { code: '56', label: 'SV' },
    { code: '57', label: 'BURGMAN' }, { code: '59', label: 'HAYABUSA' }, { code: '60', label: 'KATANA' },
    { code: '61', label: 'AVENIS' }, { code: '63', label: 'GN' }, { code: '64', label: 'FU' },
    { code: '999', label: 'VARIOUS' },
  ],
  // Yamaha Motorcycle
  'MOTORCYCLE_12': [
    { code: '1', label: 'MIO' }, { code: '2', label: 'CRYPTON' }, { code: '3', label: 'SNIPER' },
    { code: '4', label: 'YBR' }, { code: '5', label: 'STX' }, { code: '6', label: 'SZ16' },
    { code: '7', label: 'VEGA FORCE' }, { code: '8', label: 'NOUVO' }, { code: '9', label: 'V' },
    { code: '10', label: 'YZF R1' }, { code: '11', label: 'RS' }, { code: '12', label: 'X-1' },
    { code: '13', label: 'FZ16' }, { code: '14', label: 'SZ-R' }, { code: '16', label: 'F1Z' },
    { code: '17', label: 'VEGA DRUM' }, { code: '18', label: 'X1R' }, { code: '19', label: 'FINO' },
    { code: '20', label: 'XJR' }, { code: '21', label: 'FAZER' }, { code: '22', label: 'DT' },
    { code: '23', label: 'VEGA DISK' }, { code: '24', label: 'NMAX' }, { code: '25', label: 'VINO' },
    { code: '26', label: 'RXT' }, { code: '27', label: 'SEROW' }, { code: '28', label: 'TRICITY' },
    { code: '29', label: 'FZi' }, { code: '30', label: 'XTZ' }, { code: '31', label: 'L2' },
    { code: '32', label: 'FZ' }, { code: '33', label: 'SZ' }, { code: '34', label: 'XS' },
    { code: '35', label: 'YZF R3' }, { code: '36', label: 'MT' }, { code: '37', label: 'TFX' },
    { code: '38', label: 'YTX' }, { code: '39', label: 'FZ1' }, { code: '40', label: 'SIGHT' },
    { code: '41', label: 'YZF R15' }, { code: '42', label: 'YMC' }, { code: '43', label: 'GLADIATOR' },
    { code: '44', label: 'YZF R6' }, { code: '45', label: 'XSR' }, { code: '46', label: 'AEROX' },
    { code: '47', label: 'XMAX' }, { code: '48', label: 'TMAX' }, { code: '49', label: 'MAJESTY' },
    { code: '50', label: 'BWS' }, { code: '51', label: 'RD' }, { code: '52', label: 'XT' },
    { code: '53', label: 'TRACER' }, { code: '54', label: 'YZR' }, { code: '55', label: 'CYGNUS' },
    { code: '56', label: 'WR' }, { code: '57', label: 'CHAPPY' }, { code: '58', label: 'BOLT' },
    { code: '59', label: 'SRE' }, { code: '60', label: 'TTX' }, { code: '61', label: 'VEGA ZR' },
    { code: '62', label: 'TENERE' }, { code: '63', label: 'YZF R1M' }, { code: '999', label: 'VARIOUS' },
  ],
  // Kawasaki Motorcycle
  'MOTORCYCLE_14': [
    { code: '1', label: 'BOXER' }, { code: '2', label: 'CT' }, { code: '3', label: 'FURY' },
    { code: '4', label: 'ROUSER' }, { code: '5', label: 'BARAKO' }, { code: '6', label: 'AURA NEXUS' },
    { code: '7', label: 'WIND' }, { code: '8', label: 'HD' }, { code: '9', label: 'ATHLETE' },
    { code: '10', label: 'AURA' }, { code: '11', label: 'BAJAJ' }, { code: '12', label: 'KLX' },
    { code: '13', label: 'DISCOVER' }, { code: '14', label: 'KMX' }, { code: '15', label: 'KC' },
    { code: '16', label: 'ZX' }, { code: '17', label: 'ELIMINATOR' }, { code: '18', label: 'SD' },
    { code: '19', label: 'D-TRACKER' }, { code: '20', label: 'CURVE' }, { code: '21', label: 'NINJA' },
    { code: '22', label: 'BC' }, { code: '23', label: 'KE' }, { code: '24', label: 'KAZE ZONE' },
    { code: '25', label: 'VERSYS' }, { code: '26', label: 'AVENGER' }, { code: '27', label: 'Z' },
    { code: '28', label: 'LEOSTAR' }, { code: '29', label: 'HDX' }, { code: '30', label: 'W800' },
    { code: '31', label: 'ER' }, { code: '32', label: 'VULCAN' }, { code: '33', label: 'BRUTUS' },
    { code: '34', label: 'KP' }, { code: '35', label: 'AR' }, { code: '36', label: 'DOMINAR' },
    { code: '37', label: 'KB' }, { code: '38', label: 'W' }, { code: '39', label: 'XANTHUS' },
    { code: '40', label: 'TC' }, { code: '999', label: 'VARIOUS' },
  ],
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get('vehicleType')
    const makeCode = searchParams.get('makeCode')
    if (!vehicleType || !makeCode) {
      return NextResponse.json({ success: false, error: 'vehicleType and makeCode required' }, { status: 400 })
    }

    // Try to read from file first
    const lines = tryReadPolicyFile('MotorModel')
    if (lines) {
      const dataStart = lines.findIndex(l => /^\d+\t/.test(l.trim()))
      if (dataStart !== -1) {
        const models: { code: string; label: string }[] = []
        const seen = new Set<string>()
        for (let i = dataStart; i < lines.length; i++) {
          const line = lines[i]; if (!line) continue
          const parts = line.split('\t')
          if (parts.length < 5) continue
          const vType = parts[1]?.trim()
          const mCode = parts[2]?.trim()
          const modelCode = parts[3]?.trim()
          const modelDesc = parts[4]?.trim()
          if (!modelCode || !modelDesc || modelCode === 'IMOModelCode') continue
          if (vType !== vehicleType || mCode !== makeCode) continue
          if (!seen.has(modelCode)) { seen.add(modelCode); models.push({ code: modelCode, label: modelDesc }) }
        }
        if (models.length > 0) {
          models.sort((a, b) => a.label.localeCompare(b.label))
          return NextResponse.json({ success: true, data: models })
        }
      }
    }

    // Fallback to static data
    const key = `${vehicleType}_${makeCode}`
    const fallback = FALLBACK_MODELS[key]
    if (fallback) {
      const sorted = [...fallback].sort((a, b) => a.label.localeCompare(b.label))
      return NextResponse.json({ success: true, data: sorted })
    }

    // Generic fallback
    return NextResponse.json({ success: true, data: [{ code: '999', label: 'VARIOUS' }] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
