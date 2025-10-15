// Type declarations for react-hook-form
declare module 'react-hook-form' {
  export interface UseFormProps<TFieldValues extends FieldValues = FieldValues, TContext = any> {
    mode?: Mode;
    reValidateMode?: Mode;
    defaultValues?: DefaultValues<TFieldValues>;
    resolver?: Resolver<TFieldValues, TContext>;
    context?: TContext;
    shouldFocusError?: boolean;
    shouldUnregister?: boolean;
    shouldUseNativeValidation?: boolean;
    criteriaMode?: CriteriaMode;
    delayError?: number;
  }

  export type Mode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  export type CriteriaMode = 'firstError' | 'all';
  export type FieldValues = Record<string, any>;
  export type DefaultValues<TFieldValues> = Partial<TFieldValues>;
  
  export type Resolver<TFieldValues, TContext> = (
    values: TFieldValues,
    context?: TContext,
  ) => Promise<{ values: TFieldValues; errors: Record<string, { message: string }> }>;

  export interface UseFormReturn<TFieldValues extends FieldValues = FieldValues, TContext = any> {
    watch: WatchInternal<TFieldValues>;
    getValues: GetValues<TFieldValues>;
    getFieldState: GetFieldState<TFieldValues>;
    setError: SetError<TFieldValues>;
    clearErrors: ClearErrors<TFieldValues>;
    setValue: SetValue<TFieldValues>;
    trigger: TriggerInternal<TFieldValues>;
    formState: FormState<TFieldValues>;
    resetField: ResetField<TFieldValues>;
    reset: Reset<TFieldValues>;
    handleSubmit: HandleSubmit<TFieldValues>;
    unregister: UnregisterInternal<TFieldValues>;
    control: Control<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
    setFocus: SetFocus<TFieldValues>;
  }
  
  export interface FormState<TFieldValues extends FieldValues = FieldValues> {
    isDirty: boolean;
    isLoading: boolean;
    isSubmitted: boolean;
    isSubmitSuccessful: boolean;
    isSubmitting: boolean;
    isValidating: boolean;
    isValid: boolean;
    submitCount: number;
    dirtyFields: Record<string, boolean>;
    touchedFields: Record<string, boolean>;
    errors: FieldErrors<TFieldValues>;
    defaultValues?: DefaultValues<TFieldValues>;
  }
  
  export type FieldErrors<TFieldValues extends FieldValues = FieldValues> = Record<
    keyof TFieldValues & string,
    FieldError
  >;

  export interface FieldError {
    type: string;
    message?: string;
  }

  export type Control<TFieldValues extends FieldValues = FieldValues> = {
    _formState: FormState<TFieldValues>;
    _defaultValues: DefaultValues<TFieldValues>;
  };
  
  export type UseFormRegister<TFieldValues extends FieldValues = FieldValues> = (
    name: Path<TFieldValues>,
  ) => RegisterOptions;

  export interface RegisterOptions {
    onChange: (event: any) => void;
    onBlur: (event: any) => void;
    ref: (instance: any) => void;
    name: string;
  }

  export type Path<T> = keyof T & string;
  
  // Stub functions and types for the imported entities, only for TypeScript
  export function useForm<TFieldValues extends FieldValues = FieldValues, TContext = any>(
    props?: UseFormProps<TFieldValues, TContext>,
  ): UseFormReturn<TFieldValues, TContext>;
  
  // Additional stub types
  type WatchInternal<T> = (name?: any) => any;
  type GetValues<T> = (name?: any) => any;
  type GetFieldState<T> = (name: any) => any;
  type SetError<T> = (name: any, error: any) => void;
  type ClearErrors<T> = (name?: any) => void;
  type SetValue<T> = (name: any, value: any) => void;
  type TriggerInternal<T> = (name?: any) => Promise<boolean>;
  type ResetField<T> = (name: any) => void;
  type Reset<T> = (values?: any) => void;
  type HandleSubmit<T> = (onValid: (data: T) => void, onInvalid?: (errors: any) => void) => (e?: any) => void;
  type UnregisterInternal<T> = (name?: any) => void;
  type SetFocus<T> = (name: any) => void;
  
  export type SubmitHandler<T> = (data: T) => void | Promise<void>;
}