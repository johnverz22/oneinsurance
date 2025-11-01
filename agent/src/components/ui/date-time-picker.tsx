'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format, isDate } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DateRange, DayPicker } from 'react-day-picker'
import { PopoverProps } from '@radix-ui/react-popover'
import {
  formatSelection,
  getDateFormat,
  getDatePlaceholderFormat,
  isValidSelection,
} from '@/utils/date'

type SingleOrMultipleProps = {
  mode?: 'single' | 'multiple'
  variant?: 'date' | 'dateTime'
  value?: Date
  defaultValue?: Date
  onChange?: (value: Date) => void
}

type RangeProps = {
  mode: 'range'
  variant?: 'date'
  value?: DateRange
  defaultValue?: DateRange
  onChange?: (value: DateRange) => void
  required?: boolean
}

type CommonProps = {
  disabled?: React.ComponentProps<typeof DayPicker>['disabled']
  modal?: PopoverProps['modal']
}

type DateTimePickerProps = (SingleOrMultipleProps | RangeProps) & CommonProps

export const DateTimePicker = ({
  variant = 'dateTime',
  value,
  defaultValue,
  onChange,
  disabled,
  modal,
  mode = 'single',
}: DateTimePickerProps) => {
  const [date, setDate] = React.useState(value ?? defaultValue)
  const [isOpen, setIsOpen] = React.useState(false)

  const isValid = isValidSelection(date, mode)
  const dateFormat = getDateFormat(variant, mode)

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleDateSelect = (selected: any) => {
    if (selected) {
      setDate(selected)
      onChange?.(selected)

      if (mode === 'single') {
        setIsOpen(false)
      }
    }
  }

  const handleTimeChange = (
    type: 'hour' | 'minute' | 'ampm',
    value: string
  ) => {
    if (variant === 'date' || mode !== 'single') return
    if (!isValid) return

    const current = date as Date
    const newDate = new Date(current)

    if (type === 'hour') {
      newDate.setHours(
        (parseInt(value) % 12) + (newDate.getHours() >= 12 ? 12 : 0)
      )
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(value))
    } else if (type === 'ampm') {
      const currentHours = newDate.getHours()
      newDate.setHours(value === 'PM' ? currentHours + 12 : currentHours - 12)
    }

    setDate(newDate)
    onChange?.(newDate as any)
  }

  React.useEffect(() => {
    setDate(value ?? defaultValue)
  }, [value, defaultValue])

  return (
    <Popover modal={modal} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'border-muted-foreground/30 h-12 w-full justify-start rounded-full border pl-3 text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {isValid
            ? formatSelection(date, mode, dateFormat)
            : getDatePlaceholderFormat(variant, mode)}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          {mode === 'range' ? (
            <Calendar
              mode="range"
              captionLayout="dropdown"
              selected={date as DateRange | undefined}
              onSelect={handleDateSelect}
              disabled={disabled}
              defaultMonth={date instanceof Date ? date : date?.from}
              required={false}
            />
          ) : mode === 'multiple' ? (
            <Calendar
              mode="multiple"
              captionLayout="dropdown"
              selected={date as Date[] | undefined}
              onSelect={handleDateSelect}
              disabled={disabled}
              defaultMonth={date instanceof Date ? date : undefined}
            />
          ) : (
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={date as Date | undefined}
              onSelect={handleDateSelect}
              disabled={disabled}
              defaultMonth={date as Date | undefined}
            />
          )}

          {variant === 'dateTime' && mode === 'single' && (
            <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {hours.reverse().map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={
                        isValid && (date as Date).getHours() % 12 === hour % 12
                          ? 'default'
                          : 'ghost'
                      }
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => handleTimeChange('hour', hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>

              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        isValid && (date as Date).getMinutes() === minute
                          ? 'default'
                          : 'ghost'
                      }
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() =>
                        handleTimeChange('minute', minute.toString())
                      }
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>

              <ScrollArea>
                <div className="flex p-2 sm:flex-col">
                  {['AM', 'PM'].map((ampm) => (
                    <Button
                      key={ampm}
                      size="icon"
                      variant={
                        isValid &&
                        ((ampm === 'AM' && (date as Date).getHours() < 12) ||
                          (ampm === 'PM' && (date as Date).getHours() >= 12))
                          ? 'default'
                          : 'ghost'
                      }
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => handleTimeChange('ampm', ampm)}
                    >
                      {ampm}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
