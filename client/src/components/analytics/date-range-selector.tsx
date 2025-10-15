import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format, isSameDay, startOfDay, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangeSelector({ onChange, className }: DateRangeSelectorProps) {
  const [date, setDate] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      name: "Last 7 days",
      getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
    },
    {
      name: "Last 30 days",
      getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }),
    },
    {
      name: "Last 90 days",
      getValue: () => ({ from: subDays(new Date(), 89), to: new Date() }),
    },
    {
      name: "This year",
      getValue: () => ({ 
        from: new Date(new Date().getFullYear(), 0, 1), 
        to: new Date() 
      }),
    },
  ];

  const handleSelect = (range: DateRange) => {
    setDate(range);
    if (range.from && range.to) {
      onChange(range);
      setIsOpen(false);
    }
  };

  const formatDate = (date: Date) => format(date, "MMM dd, yyyy");

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal min-w-[300px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {formatDate(date.from)} - {formatDate(date.to)}
                </>
              ) : (
                formatDate(date.from)
              )
            ) : (
              "Select date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
          <div className="flex gap-2">
            <div className="flex flex-col gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = preset.getValue();
                    setDate(value);
                    onChange(value);
                    setIsOpen(false);
                  }}
                  className="justify-start font-normal"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            <div className="border-l"></div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date.from}
              selected={date}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleSelect({
                    from: startOfDay(range.from),
                    to: startOfDay(range.to),
                  });
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}