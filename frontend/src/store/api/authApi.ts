import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isAdmin: boolean
  isBlocked: boolean
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/auth`,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getMe: builder.query<User | null, void>({
      query: () => '/me',
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/logout', method: 'POST' }),
    }),
  }),
})

export const { useGetMeQuery, useLogoutMutation } = authApi
