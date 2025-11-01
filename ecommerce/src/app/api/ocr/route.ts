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
    return NextResponse.json({ error: 'OCR failed' }, { status: 500 })
  }
}
