import { NextRequest, NextResponse } from 'next/server'

// Placeholder API route for overriders
// TODO: Replace with actual backend integration when available
export async function GET(request: NextRequest) {
  try {
    // Mock response structure - all values set to N/A or 0 until backend is ready
    const mockResponse = {
      success: true,
      message: 'Overriders data retrieved successfully',
      data: {
        statistics: {
          total_overriders: 0,
          active_overriders: 0,
          total_sales_generated: 0,
          monthly_deduction: 0,
        },
        overriders: [],
      },
    }

    return NextResponse.json(mockResponse, { status: 200 })
  } catch (error) {
    console.error('Error fetching overriders:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch overriders data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
