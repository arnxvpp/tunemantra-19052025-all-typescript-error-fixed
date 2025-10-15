import React, { createContext, useContext, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

// Theme configuration interface
export interface ThemeConfig {
  primary: string
  variant: 'professional' | 'tint' | 'vibrant'
  appearance: 'light' | 'dark' | 'system'
  radius: number
  font: 'system' | 'inter' | 'sans' | 'mono'
}

// White label configuration interface
export interface WhiteLabelConfig {
  enabled: boolean
  brandName: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  customDomain?: string
  customLoginUrl?: string
  contactInfo: {
    email: string
    phone: string
    address: string
    companyName: string
    supportEmail: string
  }
  featureFlags: Record<string, boolean>
  userLimits: {
    maxUsers: number
    maxArtistsPerUser: number
    maxReleasesPerMonth: number
  }
}

// Default theme configuration
const defaultThemeConfig: ThemeConfig = {
  primary: '#1E88E5', // Default primary color
  variant: 'professional',
  appearance: 'system',
  radius: 0.5,
  font: 'system',
}

// Default white label configuration
const defaultWhiteLabelConfig: WhiteLabelConfig = {
  enabled: false,
  brandName: 'Music Distribution Platform',
  logoUrl: '/logo.svg',
  primaryColor: '#1E88E5',
  secondaryColor: '#34495E',
  accentColor: '#FF5722',
  contactInfo: {
    email: 'support@example.com',
    phone: '1-800-555-1234',
    address: '123 Music Street, Suite 100, New York, NY 10001',
    companyName: 'Music Distribution, Inc.',
    supportEmail: 'support@example.com',
  },
  featureFlags: {
    analytics: true,
    bulkOperations: true,
    advancedMetadata: true,
    aiTools: true,
    royaltySplitting: true,
    multiPlatformDistribution: true,
  },
  userLimits: {
    maxUsers: 10,
    maxArtistsPerUser: 5,
    maxReleasesPerMonth: 20,
  },
}

// Theme config context type
export interface ThemeConfigContextType {
  config: ThemeConfig
  whiteLabelConfig: WhiteLabelConfig
  updateTheme: (theme: Partial<ThemeConfig>) => void
  saveWhiteLabelConfig: (config: WhiteLabelConfig) => void
  isSaving: boolean
  isLoading: boolean
  error: string | null
}

// Create the context
const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined)

// Provider component
export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultThemeConfig)
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(defaultWhiteLabelConfig)
  const [error, setError] = useState<string | null>(null)

  // Fetch theme configuration from the server
  const { isLoading } = useQuery({
    queryKey: ['theme-config'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/white-label/config')
        if (!response.ok) {
          throw new Error('Failed to fetch theme configuration')
        }
        const data = await response.json()
        if (data.theme) {
          setConfig(prev => ({ ...prev, ...data.theme }))
        }
        if (data.whiteLabel) {
          setWhiteLabelConfig(prev => ({ ...prev, ...data.whiteLabel }))
        }
        return data
      } catch (err) {
        console.error('Error fetching theme configuration:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        return null
      }
    },
    // Skip if not admin
    enabled: localStorage.getItem('isAdmin') === 'true',
  })

  // Save white label configuration mutation
  const { mutate: saveWhiteLabelConfigMutation, isPending: isSaving } = useMutation({
    mutationFn: async (newConfig: WhiteLabelConfig) => {
      try {
        const response = await fetch('/api/admin/white-label/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig),
        })
        if (!response.ok) {
          throw new Error('Failed to save white label configuration')
        }
        return await response.json()
      } catch (err) {
        console.error('Error saving white label configuration:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        return null
      }
    },
  })

  // Update theme configuration
  const updateTheme = (themeConfig: Partial<ThemeConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...themeConfig }
      // Save to localStorage for persistence
      localStorage.setItem('theme-config', JSON.stringify(newConfig))
      return newConfig
    })
  }

  // Save white label configuration
  const saveWhiteLabelConfig = (config: WhiteLabelConfig) => {
    saveWhiteLabelConfigMutation(config, {
      onSuccess: (data) => {
        if (data) {
          setWhiteLabelConfig(data)
          setError(null)
        }
      },
    })
  }

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-config')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        setConfig(prev => ({ ...prev, ...parsed }))
      } catch (err) {
        console.error('Error parsing saved theme:', err)
      }
    }

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', config.appearance)
    if (config.appearance === 'dark' || 
        (config.appearance === 'system' && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Apply CSS variables for theme
    document.documentElement.style.setProperty('--radius', `${config.radius}rem`)
    document.documentElement.style.setProperty('--primary', config.primary)
    
    // Apply font
    if (config.font !== 'system') {
      document.documentElement.classList.add(`font-${config.font}`)
    }
  }, [config.appearance, config.primary, config.radius, config.font])

  const contextValue: ThemeConfigContextType = {
    config,
    whiteLabelConfig,
    updateTheme,
    saveWhiteLabelConfig,
    isSaving,
    isLoading,
    error,
  }

  return (
    <ThemeConfigContext.Provider value={contextValue}>
      {children}
    </ThemeConfigContext.Provider>
  )
}

// Hook to use the theme config context
export function useThemeConfig() {
  const context = useContext(ThemeConfigContext)
  if (context === undefined) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider')
  }
  return context
}

// Export the context and provider
export { ThemeConfigContext }