import { NextRequest, NextResponse } from 'next/server'
import { MAKES_BY_VEHICLE_TYPE, type VehicleType } from '@/constants/motor-vehicle-data'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get('vehicleType') as VehicleType | null

    if (!vehicleType || !MAKES_BY_VEHICLE_TYPE[vehicleType]) {
      return NextResponse.json({ success: false, error: 'Invalid or missing vehicleType' }, { status: 400 })
    }

    const makes = [...MAKES_BY_VEHICLE_TYPE[vehicleType]].sort((a, b) => a.label.localeCompare(b.label))
    return NextResponse.json({ success: true, data: makes })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
