import { Badge } from '@chakra-ui/react'
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/pto'
import type { PtoStatus } from '../../types'

// upcoming = teal, active = coral, completed = gray.
export function StatusBadge({ status }: { status: PtoStatus }) {
  return (
    <Badge colorPalette={STATUS_COLOR[status]} rounded="full" px="3">
      {STATUS_LABEL[status]}
    </Badge>
  )
}
