import { ChakraProvider } from '@chakra-ui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { FunProvider } from './components/ui/Fun'
import { Toaster } from './components/ui/Toaster'
import { ColorModeProvider } from './context/ColorModeContext'
import { system } from './theme'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <AuthProvider>
          <FunProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
            <Toaster />
          </FunProvider>
        </AuthProvider>
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
)
