// Re-export the useForm hook from react-hook-form
// This wrapper ensures consistent imports across the application
import { 
  useForm as useReactHookForm, 
  FieldValues,
  DefaultValues,
  SubmitHandler,
  UseFormProps,
  UseFormReturn,
  FormState,
  Control,
  UseFormRegister,
  FieldErrors
} from "react-hook-form";

// We need to re-export the hook because TypeScript shows an error with the original import
export function useForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any
>(props?: UseFormProps<TFieldValues, TContext>): UseFormReturn<TFieldValues, TContext> {
  return useReactHookForm<TFieldValues, TContext>(props);
}

// Re-export other form-related utilities to ensure consistency
export {
  FieldValues,
  DefaultValues,
  SubmitHandler,
  UseFormProps,
  UseFormReturn,
  FormState,
  Control,
  UseFormRegister,
  FieldErrors
}

// Re-export everything else from react-hook-form
export * from "react-hook-form";