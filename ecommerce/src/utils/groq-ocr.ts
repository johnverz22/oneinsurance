import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function runGroqOCR(base64Image: string) {
  const prompt = `
  You are an OCR assistant. Extract the following fields from the ID card image:
  - id_number
  - first_name
  - middle_name
  - last_name
  - date_of_birth (format: MM/DD/YYYY)
  - id_type

  The id type value should be in equivalence to
   VOT: "Voter's ID",
  POS: 'Postal ID',
  SSS: 'Social Security System Number',
  UMI: 'Unified Multi-Purpose ID',
  PAS: 'Passport',
  TIN: 'Tax Identification Number',
  DRI: "Driver's License Number",
  PRC: 'Professional Regulation Commission ID',
  PID: 'PhilHealth ID',
  EPH: 'E-PhilSys ID',
  PHI: 'PhilSys ID',
  BID: 'Barangay ID',
  SCC: 'Senior Citizen ID',
  OTH: 'Other',

  THE MESSAGE IS MUST BE IN JSON FORMAT.
  DO NOT ADD ANY ADDITIONAL TEXT.
  `

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Example vision-capable model
    messages: [
      {
        role: 'system',
        content: 'You are a helpful OCR assistant.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      } as any, // vision input (Groq supports OpenAI-style image messages)
    ],
    temperature: 0,
  })

  const result = extractJSON(response.choices[0]?.message?.content || '')

  return result
}

function extractJSON(text: string): any {
  // Remove code fences (``` or ```json)
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('Failed to parse JSON:', cleaned)
    return { raw: text } // fallback
  }
}
