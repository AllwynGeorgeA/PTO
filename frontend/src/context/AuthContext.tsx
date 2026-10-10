import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import api, { tokenStore } from '../services/api'
import type { TokenPair, User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  setSession: (tokens: TokenPair) => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => tokenStore.access() !== null)

  useEffect(() => {
    if (!tokenStore.access()) return
    api
      .get<User>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password })
    const { data } = await api.post<TokenPair>('/auth/login', form)
    tokenStore.set(data)
    const me = await api.get<User>('/auth/me')
    setUser(me.data)
  }, [])

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      await api.post('/auth/register', { email, password, full_name: fullName })
      await login(email, password)
    },
    [login],
  )

  const setSession = useCallback(async (tokens: TokenPair) => {
    tokenStore.set(tokens)
    const me = await api.get<User>('/auth/me')
    setUser(me.data)
  }, [])

  const logout = useCallback(() => {
    const refresh_token = tokenStore.refresh()
    if (refresh_token) api.post('/auth/logout', { refresh_token }).catch(() => undefined)
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, setSession, updateUser: setUser }),
    [user, isLoading, login, register, logout, setSession],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
