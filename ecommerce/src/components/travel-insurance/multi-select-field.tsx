import { Check, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'

export interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

const MultiSelectDestinations: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleOption = (value: string) => {
    const isCurrentlySelected = selected.includes(value)

    // If removing an item, just remove it
    if (isCurrentlySelected) {
      const newSelected = selected.filter((item) => item !== value)
      onChange(newSelected)
      return
    }

    // If adding an item, check for conflicts
    const isAddingPhilippines = value === 'Philippines'
    const currentHasPhilippines = selected.includes('Philippines')
    const currentHasInternational = selected.some(
      (item) => item !== 'Philippines'
    )

    // Show conflict dialog if there's a mix
    if (isAddingPhilippines && currentHasInternational) {
      showConflictToast('adding-philippines', value)
      return
    }

    if (!isAddingPhilippines && currentHasPhilippines) {
      showConflictToast('adding-international', value)
      return
    }

    // No conflict, add the item
    onChange([...selected, value])
  }

  const showConflictToast = (
    conflictType: 'adding-philippines' | 'adding-international',
    newValue: string
  ) => {
    const isAddingPhilippines = conflictType === 'adding-philippines'

    toast.info(
      <div>
        <h1 className="font-black">Choose Travel Type</h1>
        <p>
          {isAddingPhilippines
            ? 'You have international destinations selected. International and domestic travel coverage cannot be bought under the same plan.'
            : 'You have Philippines selected for domestic coverage. International and domestic travel coverage cannot be bought under the same plan.'}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant={'secondary'}
            onClick={() => {
              toast.dismiss()
              if (isAddingPhilippines) {
                onChange(['Philippines']) // Go domestic
              } else {
                onChange(['Philippines']) // Keep domestic
              }
            }}
          >
            {isAddingPhilippines ? 'Go Domestic' : 'Keep Domestic'}
          </Button>
          <Button
            onClick={() => {
              toast.dismiss()
              if (isAddingPhilippines) {
                // Keep current international selection
                return
              } else {
                // Switch to international
                const internationalSelection = selected.filter(
                  (s) => s !== 'Philippines'
                )
                onChange([...internationalSelection, newValue])
              }
            }}
          >
            {isAddingPhilippines ? 'Keep International' : 'Go International'}
          </Button>
        </div>
      </div>,
      {
        duration: Infinity,
      }
    )
  }

  const handleRemoveItem = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== value))
  }

  const handleKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      handleRemoveItem(value, e as any)
    }
  }

  const getSelectedLabels = () => {
    return selected.map(
      (value) =>
        options.find((option) => option.value === value)?.label || value
    )
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Container */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-within:ring-ring flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border px-2 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none sm:px-3"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground text-xs sm:text-sm">
              {placeholder}
            </span>
          ) : (
            getSelectedLabels().map((label, index) => (
              <span
                key={selected[index]}
                className="bg-secondary text-secondary-foreground inline-flex max-w-full items-center rounded-md px-1.5 py-0.5 text-xs font-medium sm:px-2 sm:py-1"
              >
                <span className="max-w-[80px] truncate sm:max-w-[120px] md:max-w-none">
                  {label}
                </span>
                <span
                  onClick={(e) => handleRemoveItem(selected[index], e)}
                  onKeyDown={(e) => handleKeyDown(e, selected[index])}
                  className="hover:text-destructive focus:text-destructive ml-1 flex-shrink-0 cursor-pointer focus:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`Remove ${label}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`ml-1 h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="bg-popover text-popover-foreground absolute top-full left-0 z-50 mt-1 w-full rounded-md border p-2 shadow-md sm:p-4">
          <div className="h-fit">
            {options.length === 0 ? (
              <div className="text-muted-foreground px-2 py-2 text-center text-sm">
                No options available
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {options.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggleOption(option.value)}
                      className={`focus:ring-ring inline-flex max-w-full min-w-0 items-center rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none sm:px-4 sm:py-2 sm:text-sm ${
                        isSelected
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border-input bg-background hover:bg-accent hover:text-accent-foreground border'
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="ml-1 h-3 w-3 flex-shrink-0 sm:ml-2 sm:h-4 sm:w-4" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelectDestinations
