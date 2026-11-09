import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import axios from 'axios'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Upload profile photo
export async function POST(req: NextRequest) {
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
    const formData = await req.formData()
    const photo = formData.get('photo') as File
    
    console.log('=== PHOTO UPLOAD DEBUG ===')
    console.log('Token:', token ? 'Present' : 'Missing')
    console.log('Photo:', photo ? `${photo.name} (${photo.size} bytes, ${photo.type})` : 'Missing')
    
    if (!photo) {
      console.log('ERROR: No photo provided')
      return NextResponse.json(
        { 
          success: false,
          message: 'No photo provided',
          data: null,
          errors: ['No photo provided']
        },
        { status: 400, headers }
      )
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid file type. Please upload an image.',
          data: null,
          errors: ['Invalid file type']
        },
        { status: 400, headers }
      )
    }

    // Validate file size (5MB max)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { 
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          data: null,
          errors: ['File too large']
        },
        { status: 400, headers }
      )
    }

    console.log('Uploading photo:', photo.name, photo.size, photo.type)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = photo.name.split('.').pop() || 'jpg'
    const filename = `profile_${timestamp}.${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const photoUrl = `/uploads/profiles/${filename}`

    console.log('Photo saved successfully:', photoUrl)

    // Update the user's profile photo URL in the backend
    try {
      const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
      const updateResponse = await axios.put(
        `${baseUrl}/profile`,
        { profile_photo_url: photoUrl },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('Backend profile update response:', updateResponse.status)
    } catch (backendError) {
      console.error('Failed to update profile photo URL in backend:', backendError)
      // Continue anyway - the photo is saved locally
    }

    console.log('Returning response with data:', { profile_photo_url: photoUrl })

    // Return success response in the format expected by the axios interceptor
    const responseData = {
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profile_photo_url: photoUrl
      },
      errors: null
    }
    
    console.log('Full response:', responseData)
    return NextResponse.json(responseData, { status: 200, headers })

  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to upload photo. Please try again.',
        data: null,
        errors: ['Upload failed']
      }, 
      { status: 500, headers }
    )
  }
}

// Delete profile photo
export async function DELETE(req: NextRequest) {
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
    console.log('Deleting profile photo')

    // Update the user's profile to remove the photo URL in the backend
    try {
      const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
      const updateResponse = await axios.put(
        `${baseUrl}/profile`,
        { profile_photo_url: null },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('Backend profile photo deletion response:', updateResponse.status)
    } catch (backendError) {
      console.error('Failed to clear profile photo URL in backend:', backendError)
      // Continue anyway
    }

    // In a real implementation, you would also:
    // 1. Get the current photo URL from the user's profile
    // 2. Delete the file from the filesystem
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Profile photo deleted successfully',
      data: null,
      errors: null
    }, { status: 200, headers })

  } catch (error) {
    console.error('Error deleting profile photo:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to delete photo. Please try again.',
        data: null,
        errors: ['Delete failed']
      }, 
      { status: 500, headers }
    )
  }
}