import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fechas',
  className,
  align = 'end',
}: DateRangePickerProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal h-9',
                  !value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value?.from ? (
                  value.to ? (
                    <>
                      {format(value.from, 'LLL dd, y', { locale: es })} -{' '}
                      {format(value.to, 'LLL dd, y', { locale: es })}
                    </>
                  ) : (
                    format(value.from, 'LLL dd, y', { locale: es })
                  )
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align={align}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => onChange(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
