import Groq from 'groq-sdk'

if (!process.env.GROQ_API_KEY) {
  console.warn('GROQ_API_KEY is not set in environment variables')
}

// Initialize Groq client - will be recreated if API key changes
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables')
  }
  return new Groq({ apiKey })
}

export async function runGroqOCR(base64Image: string) {
  const apiKey = process.env.GROQ_API_KEY
  
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing from environment variables')
    throw new Error('GROQ_API_KEY is not configured. Please set it in your ecommerce/.env file.')
  }
  
  if (apiKey === '' || apiKey.length < 10) {
    console.error('GROQ_API_KEY appears to be invalid (too short or empty)')
    throw new Error('GROQ_API_KEY appears to be invalid. Please check your ecommerce/.env file.')
  }

  console.log('Using Groq API key (length:', apiKey.length, ')')

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

  const groq = getGroqClient()
  
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
