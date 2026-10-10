import { createContext, useContext } from 'react'

export interface FunApi {
  /** Emoji burst from a point (defaults to the screen centre). No-op under reduced motion. */
  burst: (at?: { x: number; y: number }) => void
  /** Falling emoji shower (the logo easter egg). No-op under reduced motion. */
  shower: () => void
}

export const NOOP: FunApi = { burst: () => undefined, shower: () => undefined }
export const FunContext = createContext<FunApi>(NOOP)
export const useFun = (): FunApi => useContext(FunContext)

