import { Box } from '@chakra-ui/react'

export function MeshBackground() {
  return (
    <Box position="fixed" inset="0" zIndex="-1" overflow="hidden" pointerEvents="none">
      <Box position="absolute" top="-10%" left="15%" w="96" h="96" rounded="full" bg="ocean.300" filter="blur(90px)" opacity="0.3" />
      <Box position="absolute" bottom="-10%" right="15%" w="96" h="96" rounded="full" bg="sunset.300" filter="blur(90px)" opacity="0.3" />
    </Box>
  )
}
