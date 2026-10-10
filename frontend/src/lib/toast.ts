import { createToaster } from '@chakra-ui/react'

export const toaster = createToaster({ placement: 'bottom-start', pauseOnPageIdle: true })

export const toastOk = (title: string, description?: string) =>
  toaster.create({ title, description, type: 'success', duration: 3000 })
export const toastError = (title: string, description?: string) =>
  toaster.create({ title, description, type: 'error', duration: 5000 })
