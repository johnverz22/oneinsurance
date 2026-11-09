export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  date_of_birth?: string
  designation?: string
  created_at: string
  updated_at: string
}

export interface PaginatedUsersResponse {
  success: boolean
  message: string
  data: User[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface UserResponse {
  success: boolean
  message: string
  data: User
}

export interface SearchUsersResponse {
  success: boolean
  message: string
  data: User[]
}

export async function getUsers(searchParams?: URLSearchParams): Promise<PaginatedUsersResponse> {
  const url = searchParams 
    ? `/api/admin/users?${searchParams.toString()}`
    : '/api/admin/users'
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

export async function getUser(id: string): Promise<UserResponse> {
  const response = await fetch(`/api/admin/users/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }

  return response.json()
}

export async function searchUsers(keyword: string): Promise<SearchUsersResponse> {
  const response = await fetch('/api/admin/users/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword }),
  })

  if (!response.ok) {
    throw new Error('Failed to search users')
  }

  return response.json()
}