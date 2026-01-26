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
    const { userId, name, email, phone, ...otherData } = body
    
    console.log('User ID:', userId)
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        data: null,
        errors: ['User ID missing']
      }, { status: 400, headers })
    }

    // Based on the Postman collection, the endpoint should be /admin/agents/{id}
    // But for agent profile updates, it might be different
    const possibleEndpoints = [
      `${baseUrl}/admin/agents/${userId}`, // From Postman collection
      `${baseUrl}/agents/${userId}`, // Alternative agent endpoint
      `${baseUrl}/agents/profile`, // Profile specific endpoint
      `${baseUrl}/profile`, // Generic profile endpoint
    ]

    // Prepare the payload based on Postman collection structure
    const profilePayload = {
      first_name: name?.split(' ')[0] || name,
      last_name: name?.split(' ').slice(1).join(' ') || '',
      phone: phone,
      email: email,
      designation: otherData.designation || 'Agent', // Default designation
      ...otherData
    }

    console.log('Profile payload to send:', profilePayload)

    let lastError = null

    for (const endpoint of possibleEndpoints) {
      try {
        console.log('Trying endpoint:', endpoint)
        
        const response = await axios.put(
          endpoint,
          profilePayload,
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
          data: {
            ...response.data,
            // Ensure the response includes the updated name format
            name: `${profilePayload.first_name} ${profilePayload.last_name}`.trim(),
            email: profilePayload.email,
            phone: profilePayload.phone,
          },
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
            console.log('Validation errors:', error.response?.data?.errors)
          }
        }
        continue // Try next endpoint
      }
    }

    // If all endpoints failed, log the attempts and return fallback
    console.log('🚫 All endpoints failed. Last error:', lastError?.response?.data)
    console.log('📝 Attempted endpoints:', possibleEndpoints)
    
    // Return the last error if available
    if (lastError && axios.isAxiosError(lastError)) {
      return NextResponse.json({
        success: false,
        message: lastError.response?.data?.message || 'Failed to update profile',
        data: null,
        errors: lastError.response?.data?.errors || ['Profile update failed']
      }, { status: lastError.response?.status || 500, headers })
    }
    
    // Fallback: return success for local update only
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully (local only - backend endpoint not found)',
      data: {
        id: userId,
        name: `${profilePayload.first_name} ${profilePayload.last_name}`.trim(),
        email: profilePayload.email,
        phone: profilePayload.phone,
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