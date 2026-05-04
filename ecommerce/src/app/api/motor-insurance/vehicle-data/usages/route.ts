import { NextRequest, NextResponse } from 'next/server'

// Static vehicle usage data from IMO policy model
// For motorcycles, usage code is always 3 (MOTORCYCLE)
// For private cars, usage codes vary
const VEHICLE_USAGE_BY_TYPE: Record<string, { code: string; label: string }[]> = {
  MOTORCYCLE: [
    { code: '3', label: 'MOTORCYCLE' },
  ],
  PRIVATECAR: [
    { code: '1', label: 'PRIVATE CAR' },
    { code: '2', label: 'FOR HIRE' },
  ],
  COMMERCIAL: [
    { code: '1', label: 'PRIVATE' },
    { code: '2', label: 'FOR HIRE' },
    { code: '3', label: 'MOTORCYCLE' },
  ],
  LTO: [
    { code: '1', label: 'PRIVATE' },
    { code: '2', label: 'FOR HIRE' },
    { code: '3', label: 'MOTORCYCLE' },
  ],
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get('vehicleType')
    const makeCode = searchParams.get('makeCode')
    const modelCode = searchParams.get('modelCode')
    const bodyTypeCode = searchParams.get('bodyTypeCode')
    const year = searchParams.get('year')
    const subModelCode = searchParams.get('subModelCode')
    if (!vehicleType || !makeCode || !modelCode || !bodyTypeCode || !year || !subModelCode) {
      return NextResponse.json({ success: false, error: 'All params required' }, { status: 400 })
    }

    const usages = VEHICLE_USAGE_BY_TYPE[vehicleType] || [{ code: '1', label: 'PRIVATE' }]
    return NextResponse.json({ success: true, data: usages })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
