import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

// Vacation palette: ocean teal, sunset coral, sand.
const config = defineConfig({
  globalCss: {
    'html, body': { bg: 'bg', color: 'fg' },
  },
  theme: {
    tokens: {
      colors: {
        ocean: {
          50: { value: '#e6fbfa' },
          100: { value: '#c1f3f0' },
          200: { value: '#94e6e1' },
          300: { value: '#5fd3cd' },
          400: { value: '#2fbbb5' },
          500: { value: '#14a09b' },
          600: { value: '#0e807d' },
          700: { value: '#0f6664' },
          800: { value: '#104f4e' },
          900: { value: '#0d3a3a' },
        },
        sunset: {
          50: { value: '#fff1ec' },
          100: { value: '#ffddd0' },
          200: { value: '#ffbea5' },
          300: { value: '#ff9a75' },
          400: { value: '#ff7a50' },
          500: { value: '#f55d33' },
          600: { value: '#d94622' },
          700: { value: '#b3361a' },
          800: { value: '#8c2c19' },
          900: { value: '#6f2717' },
        },
      },
      radii: { card: { value: '1.5rem' } },
    },
    semanticTokens: {
      colors: {
        bg: { DEFAULT: { value: { base: '#fdf9f1', _dark: '#0b1d24' } } },
        fg: { DEFAULT: { value: { base: '#12333a', _dark: '#e6f4f3' } } },
        surface: { value: { base: 'rgba(255,255,255,0.75)', _dark: 'rgba(255,255,255,0.07)' } },
        border: { DEFAULT: { value: { base: '#e7dfcf', _dark: 'rgba(255,255,255,0.15)' } } },
        brand: {
          solid: { value: '{colors.ocean.500}' },
          contrast: { value: 'white' },
          fg: { value: { base: '{colors.ocean.700}', _dark: '{colors.ocean.200}' } },
          muted: { value: { base: '{colors.ocean.100}', _dark: '{colors.ocean.800}' } },
          subtle: { value: { base: '{colors.ocean.50}', _dark: '{colors.ocean.900}' } },
          emphasized: { value: { base: '{colors.ocean.200}', _dark: '{colors.ocean.700}' } },
          focusRing: { value: '{colors.ocean.500}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
