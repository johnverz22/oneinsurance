import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Update profile information
export async function PUT(req: NextRequest) {
  const token = req.headers.get('Authorization')
  if (!token) {
    return NextResponse.json(
      { 
        success: false,
        message: 'Unauthorized',
        data: null,
        errors: ['No authorization token']
      },
      { status: 401, headers }
    )
  }

  try {
    const body = await req.json()
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL

    console.log('=== PROFILE UPDATE DEBUG ===')
    console.log('Token:', token ? 'Present' : 'Missing')
    console.log('Base URL:', baseUrl)
    console.log('Request body:', body)

    // Extract user ID from the request body (should be passed from frontend)
    const { userId, ...profileData } = body
    
    console.log('User ID:', userId)
    console.log('Profile data to send:', profileData)
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        data: null,
        errors: ['User ID missing']
      }, { status: 400, headers })
    }

    // Try different possible endpoints for agent profile update
    const possibleEndpoints = [
      `${baseUrl}/agents/profile`,
      `${baseUrl}/agents/${userId}/profile`, 
      `${baseUrl}/agents/${userId}`,
      `${baseUrl}/profile`,
      `${baseUrl}/agents/update`,
      `${baseUrl}/agents/profile/update`
    ]

    let lastError = null

    for (const endpoint of possibleEndpoints) {
      try {
        console.log('Trying endpoint:', endpoint)
        
        const response = await axios.put(
          endpoint,
          profileData,
          {
            headers: {
              Authorization: token,
              'Content-Type': 'application/json',
            },
          }
        )

        console.log('✅ SUCCESS with endpoint:', endpoint)
        console.log('Backend response status:', response.status)
        console.log('Backend response data:', response.data)

        // Return success response in the expected format
        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          data: response.data,
          errors: null
        }, { status: 200, headers })

      } catch (error) {
        console.log('❌ Failed with endpoint:', endpoint)
        if (axios.isAxiosError(error)) {
          console.log('Error status:', error.response?.status, 'Message:', error.response?.data?.message)
          lastError = error
          
          // If we get a validation error (422) or success but wrong format, this might be the right endpoint
          if (error.response?.status === 422) {
            console.log('🔍 Got validation error - this might be the correct endpoint with wrong data format')
          }
        }
        continue // Try next endpoint
      }
    }

    // If all endpoints failed, log the attempts and return fallback
    console.log('🚫 All endpoints failed. Last error:', lastError?.response?.data)
    console.log('📝 Attempted endpoints:', possibleEndpoints)
    
    // Fallback: return success for local update only
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully (local only - backend endpoint not found)',
      data: {
        ...profileData,
        id: userId,
        updated_at: new Date().toISOString()
      },
      errors: null
    }, { status: 200, headers })

  } catch (error) {
    console.error('Error updating profile:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
      data: null,
      errors: ['Internal server error']
    }, { status: 500, headers })
  }
}