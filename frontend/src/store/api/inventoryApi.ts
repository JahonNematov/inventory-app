import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL}/api`,
  credentials: 'include',
})

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery,
  tagTypes: ['Inventory', 'Item', 'Field', 'Comment', 'User'],

  endpoints: (builder) => ({
    // ── Inventories ────────────────────────────────────────
    getInventories: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 12 } = {}) => `/inventories?page=${page}&limit=${limit}`,
      providesTags: ['Inventory'],
    }),

    getPopularInventories: builder.query<any[], void>({
      query: () => '/inventories/popular',
      providesTags: ['Inventory'],
    }),

    getInventory: builder.query<any, string>({
      query: (id) => `/inventories/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Inventory', id }],
    }),

    createInventory: builder.mutation<any, any>({
      query: (body) => ({ url: '/inventories', method: 'POST', body }),
      invalidatesTags: ['Inventory'],
    }),

    updateInventory: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/inventories/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Inventory', id }],
    }),

    deleteInventory: builder.mutation<void, string>({
      query: (id) => ({ url: `/inventories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Inventory'],
    }),

    // ── Fields ─────────────────────────────────────────────
    createField: builder.mutation<any, { inventoryId: string; data: any }>({
      query: ({ inventoryId, data }) => ({
        url: `/inventories/${inventoryId}/fields`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { inventoryId }) => [{ type: 'Inventory', id: inventoryId }],
    }),

    updateField: builder.mutation<any, { inventoryId: string; fieldId: string; data: any }>({
      query: ({ inventoryId, fieldId, data }) => ({
        url: `/inventories/${inventoryId}/fields/${fieldId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Field'],
    }),

    deleteField: builder.mutation<void, { inventoryId: string; fieldId: string }>({
      query: ({ inventoryId, fieldId }) => ({
        url: `/inventories/${inventoryId}/fields/${fieldId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Field'],
    }),

    reorderFields: builder.mutation<void, { inventoryId: string; orderedIds: string[] }>({
      query: ({ inventoryId, orderedIds }) => ({
        url: `/inventories/${inventoryId}/fields/reorder`,
        method: 'PUT',
        body: { orderedIds },
      }),
      invalidatesTags: ['Field'],
    }),

    // ── Custom ID ──────────────────────────────────────────
    updateCustomIdFormat: builder.mutation<any, { inventoryId: string; elements: any[] }>({
      query: ({ inventoryId, elements }) => ({
        url: `/inventories/${inventoryId}/custom-id`,
        method: 'PUT',
        body: { elements },
      }),
      invalidatesTags: (_result, _error, { inventoryId }) => [{ type: 'Inventory', id: inventoryId }],
    }),

    // ── Access ─────────────────────────────────────────────
    addAccess: builder.mutation<void, { inventoryId: string; userId: string }>({
      query: ({ inventoryId, userId }) => ({
        url: `/inventories/${inventoryId}/access`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { inventoryId }) => [{ type: 'Inventory', id: inventoryId }],
    }),

    removeAccess: builder.mutation<void, { inventoryId: string; userId: string }>({
      query: ({ inventoryId, userId }) => ({
        url: `/inventories/${inventoryId}/access/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { inventoryId }) => [{ type: 'Inventory', id: inventoryId }],
    }),

    // ── Items ──────────────────────────────────────────────
    getItems: builder.query<any, { inventoryId: string; page?: number }>({
      query: ({ inventoryId, page = 1 }) => `/items?inventoryId=${inventoryId}&page=${page}`,
      providesTags: ['Item'],
    }),

    getItem: builder.query<any, string>({
      query: (id) => `/items/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Item', id }],
    }),

    createItem: builder.mutation<any, any>({
      query: (body) => ({ url: '/items', method: 'POST', body }),
      invalidatesTags: ['Item'],
    }),

    updateItem: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/items/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Item', id }],
    }),

    deleteItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Item'],
    }),

    toggleLike: builder.mutation<{ liked: boolean }, string>({
      query: (id) => ({ url: `/items/${id}/like`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Item', id }],
    }),

    // ── Comments ───────────────────────────────────────────
    getComments: builder.query<any[], string>({
      query: (inventoryId) => `/inventories/${inventoryId}/comments`,
      providesTags: ['Comment'],
    }),

    addComment: builder.mutation<any, { inventoryId: string; text: string }>({
      query: ({ inventoryId, text }) => ({
        url: `/inventories/${inventoryId}/comments`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Comment'],
    }),

    // ── Statistics ─────────────────────────────────────────
    getStats: builder.query<any, string>({
      query: (inventoryId) => `/inventories/${inventoryId}/stats`,
    }),

    // ── My Inventories ─────────────────────────────────────
    getMyInventories: builder.query<{ owned: any[]; withAccess: any[] }, void>({
      query: () => '/users/me/inventories',
      providesTags: ['Inventory'],
    }),

    // ── Search ─────────────────────────────────────────────
    search: builder.query<any, string>({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
    }),

    searchTags: builder.query<string[], string>({
      query: (q) => `/search/tags?q=${encodeURIComponent(q)}`,
    }),

    searchUsers: builder.query<any[], string>({
      query: (q) => `/search/users?q=${encodeURIComponent(q)}`,
    }),

    // ── Admin ──────────────────────────────────────────────
    getAdminUsers: builder.query<any, { page?: number; q?: string }>({
      query: ({ page = 1, q = '' }) => `/admin/users?page=${page}&q=${q}`,
      providesTags: ['User'],
    }),

    updateUser: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['User'],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetInventoriesQuery,
  useGetPopularInventoriesQuery,
  useGetInventoryQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
  useCreateFieldMutation,
  useUpdateFieldMutation,
  useDeleteFieldMutation,
  useReorderFieldsMutation,
  useUpdateCustomIdFormatMutation,
  useAddAccessMutation,
  useRemoveAccessMutation,
  useGetItemsQuery,
  useGetItemQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useToggleLikeMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useGetStatsQuery,
  useGetMyInventoriesQuery,
  useSearchQuery,
  useSearchTagsQuery,
  useSearchUsersQuery,
  useGetAdminUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = inventoryApi
