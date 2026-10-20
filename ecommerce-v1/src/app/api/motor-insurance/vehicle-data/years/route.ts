import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get('vehicleType')
    const makeCode = searchParams.get('makeCode')
    const modelCode = searchParams.get('modelCode')
    const bodyTypeCode = searchParams.get('bodyTypeCode')
    if (!vehicleType || !makeCode || !modelCode || !bodyTypeCode) {
      return NextResponse.json({ success: false, error: 'All params required' }, { status: 400 })
    }

    // Generate years from 1970 to current year
    const currentYear = new Date().getFullYear()
    const years: { code: string; label: string }[] = []
    for (let y = currentYear; y >= 1970; y--) {
      years.push({ code: String(y), label: String(y) })
    }

    return NextResponse.json({ success: true, data: years })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
