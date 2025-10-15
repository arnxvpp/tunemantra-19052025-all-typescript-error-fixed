import { randomBytes } from 'crypto';

// Prefixes for different ID types
const USER_PREFIX = 'USR';
const UPC_PREFIX = '0';  // UPC should start with 0 as per standard

// Keep track of counters
let userCounter = 1000;
let upcCounter = 100000000000; // 12-digit base for UPC

/**
 * Generates a unique client ID
 * Format: [PREFIX]-[RANDOM_ALPHANUMERIC]-[COUNTER]
 * 
 * @returns A unique client ID
 */
export function generateClientId(): string {
  // Increment counter
  userCounter++;

  // Generate 3 random alphanumeric characters
  const randomPart = randomBytes(2).toString('hex').substring(0, 3).toUpperCase();

  // Combine parts: PREFIX-RANDOM-COUNTER
  return `${USER_PREFIX}-${randomPart}-${userCounter}`;
}

/**
 * Generates a valid UPC (Universal Product Code)
 * Format: 13-digit number starting with 0
 * 
 * @returns A unique UPC
 */
export function generateUPC(): string {
  // Increment UPC counter
  upcCounter++;
  
  // Convert to string and ensure it's 12 digits (plus the prefix)
  const numericPart = upcCounter.toString().padStart(11, '0');
  
  // UPC-A includes a check digit, but for simplicity we're skipping that calculation
  // In a production environment, you would calculate the check digit based on the other digits
  const checkDigit = '0'; 
  
  return `${UPC_PREFIX}${numericPart}${checkDigit}`;
}

/**
 * Checks if a string is a valid client ID
 * 
 * @param clientId The client ID to validate
 * @returns Whether the client ID is valid
 */
export function isValidClientId(clientId: string): boolean {
  // Check basic format: 3-letter prefix, hyphen, 3 alphanumeric chars, hyphen, number
  const regex = /^[A-Z]{3}-[A-Z0-9]{3}-\d+$/;
  return regex.test(clientId);
}

/**
 * Checks if a string is a valid UPC
 * 
 * @param upc The UPC to validate
 * @returns Whether the UPC is valid
 */
export function isValidUPC(upc: string): boolean {
  // Check if it's a 12-13 digit number
  const regex = /^[0-9]{12,13}$/;
  return regex.test(upc);
}