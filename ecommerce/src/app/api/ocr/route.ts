import { runGroqOCR } from '@/utils/groq-ocr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const result = await runGroqOCR(image)

    let parsed
    try {
      parsed = JSON.parse(result || '{}')
    } catch {
      parsed = { raw: result }
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error: any) {
    console.error('Groq OCR error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'OCR failed'
    let statusCode = 500
    
    if (error?.message?.includes('API Key') || error?.message?.includes('GROQ_API_KEY')) {
      errorMessage = 'Groq API key is not configured. Please set GROQ_API_KEY in your .env file.'
      statusCode = 500
    } else if (error?.status === 401) {
      errorMessage = 'Invalid Groq API key. Please check your GROQ_API_KEY in .env file.'
      statusCode = 401
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
