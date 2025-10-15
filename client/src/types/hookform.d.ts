// Type declarations for @hookform/resolvers/zod
declare module '@hookform/resolvers/zod' {
  import { ZodSchema } from 'zod';
  
  export function zodResolver<T>(schema: ZodSchema): (data: T) => Promise<{
    values: T;
    errors: Record<string, { message: string }>;
  }>;
}