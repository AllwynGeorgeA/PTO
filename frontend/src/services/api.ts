import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { TokenPair } from '../types'

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const BASE_URL = `${API_URL}/api/v1`

export const tokenStore = {
  access: (): string | null => localStorage.getItem('access_token'),
  refresh: (): string | null => localStorage.getItem('refresh_token'),
  set: (t: TokenPair): void => {
    localStorage.setItem('access_token', t.access_token)
    localStorage.setItem('refresh_token', t.refresh_token)
  },
  clear: (): void => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = tokenStore.access()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// One shared refresh call so parallel 401s don't each rotate the token.
let refreshing: Promise<TokenPair> | null = null

const refreshTokens = (): Promise<TokenPair> => {
  refreshing ??= axios
    .post<TokenPair>(`${BASE_URL}/auth/refresh`, { refresh_token: tokenStore.refresh() })
    .then((r) => r.data)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (error.response?.status === 401 && original && !original._retry && tokenStore.refresh()) {
      original._retry = true
      try {
        tokenStore.set(await refreshTokens())
        return api(original)
      } catch {
        tokenStore.clear()
      }
    }
    return Promise.reject(error)
  },
)

export default api
