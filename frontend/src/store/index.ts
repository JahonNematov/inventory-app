import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './api/authApi'
import { inventoryApi } from './api/inventoryApi'

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, inventoryApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
