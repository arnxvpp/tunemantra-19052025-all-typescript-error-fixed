import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MultiContributorFieldProps {
  label: string;
  description?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

export function MultiContributorField({
  label,
  description,
  value,
  onChange,
  placeholder = "Contributor name",
  required = false
}: MultiContributorFieldProps) {
  const handleChange = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  const addContributor = () => {
    onChange([...value, ""]);
  };

  const removeContributor = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <FormItem>
      <FormLabel>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2">
          {value.map((contributor, index) => (
            <div key={index} className="flex items-center space-x-2">
              <FormControl>
                <Input 
                  placeholder={placeholder}
                  value={contributor}
                  onChange={(e) => handleChange(index, e.target.value)}
                  className="flex-1"
                />
              </FormControl>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeContributor(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={addContributor}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {label}
      </Button>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}