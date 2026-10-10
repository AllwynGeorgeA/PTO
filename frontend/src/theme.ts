import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

// Two colors only: ocean teal (brand) and sunset coral (accent), on neutral grays.
const config = defineConfig({
  globalCss: {
    html: { colorPalette: 'brand' },
    'html, body': { bg: 'bg', color: 'fg', overflowX: 'hidden' },
    // Touch devices: keep every tap target at least 44px.
    'button, [role="radio"], [role="checkbox"]': { '@media (pointer: coarse)': { minHeight: '44px' } },
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
      radii: { card: { value: '1rem' } },
    },
    semanticTokens: {
      colors: {
        // Neutrals
        bg: {
          DEFAULT: { value: { base: '#f6f8f8', _dark: '#0d1417' } },
          subtle: { value: { base: '#eef2f2', _dark: '#131c21' } },
          muted: { value: { base: '#e4eaea', _dark: '#1a262c' } },
          panel: { value: { base: '#ffffff', _dark: '#151f25' } },
        },
        fg: {
          DEFAULT: { value: { base: '#10191c', _dark: '#eef3f3' } },
          muted: { value: { base: '#4d5b5f', _dark: '#a3b3b7' } },
          subtle: { value: { base: '#5f6e72', _dark: '#8fa0a4' } },
          // Status colors collapse into the two palettes: bad = coral, good = teal.
          error: { value: { base: '{colors.sunset.700}', _dark: '{colors.sunset.300}' } },
          warning: { value: { base: '{colors.sunset.700}', _dark: '{colors.sunset.300}' } },
          success: { value: { base: '{colors.ocean.700}', _dark: '{colors.ocean.200}' } },
          info: { value: { base: '{colors.ocean.700}', _dark: '{colors.ocean.200}' } },
        },
        border: {
          DEFAULT: { value: { base: '#dbe2e3', _dark: '#27343a' } },
          error: { value: { base: '{colors.sunset.500}', _dark: '{colors.sunset.400}' } },
        },
        surface: { value: { base: '#ffffff', _dark: '#151f25' } },
        brand: {
          solid: { value: { base: '{colors.ocean.600}', _dark: '{colors.ocean.400}' } },
          contrast: { value: { base: 'white', _dark: '#0b1d24' } },
          fg: { value: { base: '{colors.ocean.700}', _dark: '{colors.ocean.200}' } },
          muted: { value: { base: '{colors.ocean.100}', _dark: '{colors.ocean.800}' } },
          subtle: { value: { base: '{colors.ocean.50}', _dark: '{colors.ocean.900}' } },
          emphasized: { value: { base: '{colors.ocean.200}', _dark: '{colors.ocean.700}' } },
          border: { value: { base: '{colors.ocean.300}', _dark: '{colors.ocean.600}' } },
          focusRing: { value: '{colors.ocean.500}' },
        },
        accent: {
          solid: { value: '{colors.sunset.500}' },
          contrast: { value: '#2a0f07' },
          fg: { value: { base: '{colors.sunset.700}', _dark: '{colors.sunset.300}' } },
          muted: { value: { base: '{colors.sunset.100}', _dark: '{colors.sunset.800}' } },
          subtle: { value: { base: '{colors.sunset.50}', _dark: '{colors.sunset.900}' } },
          emphasized: { value: { base: '{colors.sunset.200}', _dark: '{colors.sunset.700}' } },
          border: { value: { base: '{colors.sunset.300}', _dark: '{colors.sunset.600}' } },
          focusRing: { value: '{colors.sunset.500}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
