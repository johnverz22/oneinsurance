import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    if (!formData) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    // Get the JSON payload from formData
    const payloadString = formData.get('payload') as string
    if (!payloadString) {
      return NextResponse.json(
        { error: 'Payload is required' },
        { status: 400 }
      )
    }

    const payload = JSON.parse(payloadString)

    // Create FormData for backend request - flatten all fields
    const backendFormData = new FormData()
    
    // Helper function to flatten nested objects into FormData with bracket notation
    const flattenToFormData = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          const formKey = prefix ? `${prefix}[${key}]` : key

          if (value === null || value === undefined) {
            continue
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                flattenToFormData(item, `${formKey}[${index}]`)
              } else {
                backendFormData.append(`${formKey}[${index}]`, String(item))
              }
            })
          } else if (typeof value === 'object' && !(value instanceof File)) {
            flattenToFormData(value, formKey)
          } else {
            backendFormData.append(formKey, String(value))
          }
        }
      }
    }

    // Flatten the entire payload
    flattenToFormData(payload)

    // Process ID images if they exist
    const idImagesCount = parseInt(formData.get('id_images_count') as string || '0')
    
    for (let i = 0; i < idImagesCount; i++) {
      const fileName = formData.get(`id_images[${i}][file_name]`) as string
      const frontId = formData.get(`id_images[${i}][front_id]`) as File
      const backId = formData.get(`id_images[${i}][back_id]`) as File

      if (fileName) {
        backendFormData.append(`CustomField[IdImages][${i}][file_name]`, fileName)
      }
      if (frontId) {
        backendFormData.append(`CustomField[IdImages][${i}][front_id]`, frontId)
      }
      if (backId) {
        backendFormData.append(`CustomField[IdImages][${i}][back_id]`, backId)
      }
    }

    const url = `${process.env.BASE_URL}/quote/travel/full-quote`

    console.log('Travel Insurance Full Quote URL:', url)
    console.log('ID Images count:', idImagesCount)

    const response = await axios.post(url, backendFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
    })

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    console.error('Error fetching travel insurance full quote:', error)
    
    if (axios.isAxiosError(error)) {
      // Log detailed validation errors
      console.error('Backend Error Response:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      return handleServerSideAxiosError(error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}