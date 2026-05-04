import { NextRequest, NextResponse } from 'next/server'

// Static body type data from IMO policy model
// Motorcycle body type is always 17 (standard motorcycle)
const BODY_TYPES_BY_VEHICLE_TYPE: Record<string, { code: string; label: string }[]> = {
  MOTORCYCLE: [
    { code: '17', label: 'Motorcycle' },
    { code: '32', label: 'ATV' },
    { code: '39', label: 'Tricycle' },
    { code: '99', label: 'Various' },
  ],
  PRIVATECAR: [
    { code: '1', label: 'Sedan' },
    { code: '2', label: 'SUV' },
    { code: '3', label: 'Van' },
    { code: '4', label: 'Pickup' },
    { code: '5', label: 'Hatchback' },
    { code: '6', label: 'Coupe' },
    { code: '7', label: 'Wagon' },
    { code: '14', label: 'Jeep' },
    { code: '15', label: 'MPV' },
    { code: '16', label: 'Crossover' },
    { code: '99', label: 'Various' },
  ],
  COMMERCIAL: [
    { code: '8', label: 'Bus' },
    { code: '9', label: 'Truck' },
    { code: '40', label: 'Cargo' },
    { code: '41', label: 'Delivery' },
    { code: '42', label: 'Flatbed' },
    { code: '43', label: 'Dump' },
    { code: '44', label: 'Tanker' },
    { code: '99', label: 'Various' },
  ],
  LTO: [
    { code: '1', label: 'Sedan' },
    { code: '2', label: 'SUV' },
    { code: '3', label: 'Van' },
    { code: '4', label: 'Pickup' },
    { code: '5', label: 'Hatchback' },
    { code: '8', label: 'Bus' },
    { code: '9', label: 'Truck' },
    { code: '17', label: 'Motorcycle' },
    { code: '99', label: 'Various' },
  ],
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get('vehicleType')
    const makeCode = searchParams.get('makeCode')
    const modelCode = searchParams.get('modelCode')
    if (!vehicleType || !makeCode || !modelCode) {
      return NextResponse.json({ success: false, error: 'All params required' }, { status: 400 })
    }

    const bodyTypes = BODY_TYPES_BY_VEHICLE_TYPE[vehicleType] || [{ code: '99', label: 'Various' }]
    return NextResponse.json({ success: true, data: bodyTypes })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
