import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { RegisterAgent, SuccesRegisterAgent } from '@/types/agent/auth'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body) {
    return NextResponse.json({ message: 'No data provided' }, { status: 400 })
  }
  
  // Basic validation for required fields
  if (!body.firstName || !body.lastName || !body.email || !body.password || !body.confirmPassword || !body.phone || !body.token) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    )
  }

  try {
    console.log('Registration request body:', { ...body, password: '[HIDDEN]' })
    
    const response = await axios.post<SuccesRegisterAgent>(
      `${process.env.BASE_URL}/agents/register`,
      {
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        password: body.password,
        password_confirmation: body.confirmPassword,
        phone: body.phone,
        invitation_token: body.token,
      }
    )
    return NextResponse.json(response.data, { status: response.status })
  } catch (error) {
    console.error('Error during agent registration:', error)
    if (axios.isAxiosError(error) && error.response) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ message: error }, { status: 500 })
  }
}
