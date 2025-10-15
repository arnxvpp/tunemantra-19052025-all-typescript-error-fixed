import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Pipette, Eye } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

// Define common web colors
const presetColors = [
  '#000000', // Black
  '#ffffff', // White
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#607d8b', // Blue Grey
];

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  previewClassName?: string;
  swatchSize?: 'sm' | 'md' | 'lg';
}

export function ColorPicker({
  value,
  onChange,
  previewClassName,
  swatchSize = 'md',
}: ColorPickerProps) {
  const [color, setColor] = useState(value || '#000000');
  const [isOpen, setIsOpen] = useState(false);
  const [isEyedropper, setIsEyedropper] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update the color when the value prop changes
  useEffect(() => {
    if (value !== color) {
      setColor(value);
    }
  }, [value]);

  // Handle color change from the picker
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  // Apply the color change and close the popover
  const applyColor = () => {
    onChange(color);
    setIsOpen(false);
  };

  // Handle color input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  // Handle eyedropper click
  const handleEyedropper = async () => {
    // Check if the EyeDropper API is available
    if (!('EyeDropper' in window)) {
      alert('EyeDropper API is not supported in this browser');
      return;
    }

    try {
      setIsEyedropper(true);
      // @ts-ignore - EyeDropper is not in the TypeScript types yet
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      setColor(result.sRGBHex);
      onChange(result.sRGBHex);
    } catch (error) {
      console.log('User canceled the eyedropper');
    } finally {
      setIsEyedropper(false);
    }
  };

  // Get the swatch size based on the prop
  const getSwatchSize = () => {
    switch (swatchSize) {
      case 'sm':
        return 'h-6 w-6';
      case 'lg':
        return 'h-10 w-10';
      case 'md':
      default:
        return 'h-8 w-8';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 border-input p-1",
            previewClassName
          )}
          onClick={() => setIsOpen(true)}
        >
          <div
            className={cn("rounded-sm border", getSwatchSize())}
            style={{ backgroundColor: color }}
          />
          <span className="text-xs">{color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="color" className="text-xs font-medium">
              Color
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="color"
                value={color}
                onChange={handleInputChange}
                className="pl-8"
                maxLength={9}
              />
              <div 
                className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-sm border"
                style={{ backgroundColor: color }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                onClick={handleEyedropper}
                disabled={isEyedropper}
              >
                <Pipette className="h-3 w-3" />
                <span className="sr-only">Pick color</span>
              </Button>
            </div>
          </div>
          
          <HexColorPicker color={color} onChange={handleColorChange} />
          
          <div>
            <Label className="text-xs font-medium">Presets</Label>
            <div className="mt-2 grid grid-cols-10 gap-1">
              {presetColors.map((presetColor) => (
                <Button
                  key={presetColor}
                  type="button"
                  variant="outline"
                  className="h-6 w-6 rounded-sm p-0"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    setColor(presetColor);
                    onChange(presetColor);
                  }}
                >
                  {presetColor === color && (
                    <Check
                      className={cn(
                        "h-3 w-3",
                        // Display white checkmark on dark colors, black on light colors
                        parseInt(presetColor.slice(1), 16) < 0x808080
                          ? "text-white"
                          : "text-black"
                      )}
                    />
                  )}
                  <span className="sr-only">
                    Select color {presetColor}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={applyColor}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ColorPicker;