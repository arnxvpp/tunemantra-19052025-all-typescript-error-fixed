import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
/**
 * Combines multiple class names, merging Tailwind CSS classes properly.
 * Uses clsx for conditional class application and tailwind-merge for 
 * proper handling of Tailwind utility classes.
 * 
 * @param inputs The class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to a standard localized string representation.
 * 
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions to customize format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  const dateObject = typeof date === 'string' ? new Date(date) : date
  return dateObject.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format a number as currency with proper decimal places.
 * 
 * @param amount The amount to format
 * @param currency The currency code (default: 'USD')
 * @param locale The locale to use (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Truncates a string to a specified length and adds ellipsis.
 * 
 * @param str The string to truncate
 * @param length Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, length: number = 50): string {
  if (!str) return ''
  return str.length > length ? `${str.substring(0, length)}...` : str
}

/**
 * Adds proper pluralization to a word based on count.
 * 
 * @param count The count to check
 * @param singular The singular form of the word
 * @param plural The plural form of the word (optional)
 * @returns The properly pluralized word
 */
export function pluralize(
  count: number, 
  singular: string, 
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`
}

/**
 * Generates a random string for use as temporary IDs.
 * 
 * @param length The length of the ID to generate
 * @returns A random string ID
 */
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Debounces a function to limit how often it can be called.
 * 
 * @param fn The function to debounce
 * @param ms The debounce delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, ms)
  }
}

/**
 * Parses query parameters from a URL string.
 * 
 * @param queryString The query string to parse
 * @returns Object containing the parsed parameters
 */
export function parseQueryParams(queryString: string): Record<string, string> {
  if (!queryString || queryString === '?') return {}
  
  const query = queryString.startsWith('?') 
    ? queryString.substring(1) 
    : queryString
    
  return query
    .split('&')
    .reduce((params, param) => {
      const [key, value] = param.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
      return params
    }, {} as Record<string, string>)
}

/**
 * Capitalizes the first letter of each word in a string.
 * 
 * @param str The string to capitalize
 * @returns String with each word capitalized
 */
export function capitalizeWords(str: string): string {
  if (!str) return ''
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Smoothly scrolls to an element on the page.
 * 
 * @param elementId The ID of the element to scroll to
 * @param offset Optional offset from the top of the element (default: 0)
 */
export function scrollToElement(elementId: string, offset: number = 0): void {
  const element = document.getElementById(elementId)
  if (!element) return
  
  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - offset
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified interval.
 * 
 * @param fn The function to throttle
 * @param ms The throttle interval in milliseconds
 * @returns A throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let lastResult: ReturnType<T>
  
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now()
    
    if (now - lastCall >= ms) {
      lastCall = now
      lastResult = fn.apply(this, args)
    }
  }
}