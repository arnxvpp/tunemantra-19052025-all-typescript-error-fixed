import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

interface TooltipLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  tooltip?: string;
  className?: string;
}

export function TooltipLabel({
  htmlFor,
  children,
  required = false,
  tooltip,
  className,
}: TooltipLabelProps) {
  return (
    <div className="flex items-center gap-1">
      <FormLabel
        htmlFor={htmlFor}
        className={cn(className)}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
      
      {tooltip && (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}