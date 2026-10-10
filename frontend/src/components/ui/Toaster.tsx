import { Portal, Stack, Toast, Toaster as ChakraToaster } from '@chakra-ui/react'

import { toaster } from '../../lib/toast'

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ base: '4', md: '6' }} mb={{ base: '20', md: '0' }}>
        {(toast) => (
          <Toast.Root width={{ md: 'sm' }} borderLeftWidth="4px" borderLeftColor={toast.type === 'error' ? 'accent.solid' : 'brand.solid'}>
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
            </Stack>
            {toast.action && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
