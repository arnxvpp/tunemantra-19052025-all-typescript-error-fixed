import React from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import CoreUIStyles from './core-ui-styles';

/**
 * CoreUIForm component
 * 
 * A wrapper for the Form component that applies CoreUI styling
 */
export function CoreUIForm(props: React.ComponentProps<typeof Form>) {
  return (
    <>
      <Form {...props} />
      <CoreUIStyles>{`
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-label {
          padding-top: calc(0.375rem + 1px);
          padding-bottom: calc(0.375rem + 1px);
          margin-bottom: 0;
          font-size: inherit;
          line-height: 1.5;
          font-weight: 500;
        }
        
        .form-control {
          display: block;
          width: 100%;
          height: calc(1.5em + 0.75rem + 2px);
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.5;
          color: #5c6873;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid #e4e7ea;
          border-radius: 0.25rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        
        .form-control:focus {
          color: #5c6873;
          background-color: #fff;
          border-color: #8ad4ee;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(32, 168, 216, 0.25);
        }
        
        .form-text {
          display: block;
          margin-top: 0.25rem;
          font-size: 80%;
        }
        
        .text-danger {
          color: #e55353 !important;
        }
        
        .form-select {
          display: block;
          width: 100%;
          height: calc(1.5em + 0.75rem + 2px);
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.5;
          color: #5c6873;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid #e4e7ea;
          border-radius: 0.25rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        
        .form-select:focus {
          border-color: #8ad4ee;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(32, 168, 216, 0.25);
        }
      `}</CoreUIStyles>
    </>
  );
}

/**
 * CoreUIFormField component 
 * 
 * A wrapper around FormField that applies CoreUI styling
 */
export function CoreUIFormField(props: React.ComponentProps<typeof FormField>) {
  return <FormField {...props} />;
}

/**
 * CoreUIFormItem component
 * 
 * A wrapper around FormItem that applies CoreUI styling
 */
export function CoreUIFormItem(props: React.ComponentProps<typeof FormItem>) {
  return <FormItem className="form-group" {...props} />;
}

/**
 * CoreUIFormLabel component
 * 
 * A wrapper around FormLabel that applies CoreUI styling
 */
export function CoreUIFormLabel(props: React.ComponentProps<typeof FormLabel>) {
  return <FormLabel className="form-label" {...props} />;
}

/**
 * CoreUIFormControl component
 * 
 * A wrapper around FormControl that applies CoreUI styling
 */
export function CoreUIFormControl(props: React.ComponentProps<typeof FormControl>) {
  return <FormControl {...props} />;
}

/**
 * CoreUIFormDescription component
 * 
 * A wrapper around FormDescription that applies CoreUI styling
 */
export function CoreUIFormDescription(props: React.ComponentProps<typeof FormDescription>) {
  return <FormDescription className="form-text text-muted" {...props} />;
}

/**
 * CoreUIFormMessage component
 * 
 * A wrapper around FormMessage that applies CoreUI styling
 */
export function CoreUIFormMessage(props: React.ComponentProps<typeof FormMessage>) {
  return <FormMessage className="form-text text-danger" {...props} />;
}

export {
  CoreUIForm as Form,
  CoreUIFormField as FormField,
  CoreUIFormItem as FormItem,
  CoreUIFormLabel as FormLabel,
  CoreUIFormControl as FormControl,
  CoreUIFormDescription as FormDescription,
  CoreUIFormMessage as FormMessage,
};