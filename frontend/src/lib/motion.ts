import { Box, Button, IconButton, type BoxProps, type ButtonProps, type IconButtonProps } from '@chakra-ui/react'
import { motion, type MotionProps } from 'framer-motion'
import type { ComponentType } from 'react'

// Chakra's `transition` style prop clashes with Framer Motion's; drop Chakra's so the types line up.
type Clash = 'transition' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
type ChakraBase = Omit<BoxProps, Clash>
// Exported prop types include Framer Motion props (whileHover, animate, ...) so wrappers can spread them.
export type MotionBoxProps = ChakraBase & MotionProps
export type MotionButtonProps = Omit<ButtonProps, Clash> & MotionProps

export const MotionBox = motion.create(Box as ComponentType<ChakraBase>)
export const MotionButton = motion.create(Button as ComponentType<Omit<ButtonProps, Clash>>)
export const MotionIconButton = motion.create(IconButton as ComponentType<Omit<IconButtonProps, Clash>>)
