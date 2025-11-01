import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TravelDestinationProps {
  travelCoverageMap: Record<
    string,
    { code: string; name: string; flag: string }[]
  >
  field: {
    state: { value: string }
    handleChange: (val: string, coverageArea?: string) => void
  }
  form?: {
    setFieldValue: (field: string, val: any) => void
  }
}

export function TravelDestinationSelection({
  form,
  field,
  travelCoverageMap,
}: TravelDestinationProps) {
  const [filter, setFilter] = useState('')

  const filteredMap = useMemo(() => {
    if (!filter.trim()) return travelCoverageMap

    const lower = filter.toLowerCase()
    const result: typeof travelCoverageMap = {}

    for (const [area, countries] of Object.entries(travelCoverageMap)) {
      const filteredCountries = countries
        .filter((c) => c.name.toLowerCase().includes(lower))
        .sort((a, b) => a.name.localeCompare(b.name))

      if (filteredCountries.length > 0) {
        result[area] = filteredCountries
      }
    }
    return result
  }, [filter, travelCoverageMap])

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        placeholder="Search destination..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-2"
      />

      <ScrollArea className="relative h-[calc(70vh-10rem)]">
        {Object.entries(filteredMap).map(([coverageArea, countries]) => (
          <TabsContent
            key={coverageArea}
            value={coverageArea}
            className="grid gap-2"
          >
            {countries.length > 0 ? (
              countries.map((country) => {
                const isSelected = field.state.value === country.name

                return (
                  <Button
                    key={country.code}
                    onClick={() => {
                      field.handleChange(country.name, coverageArea)

                      if (form) {
                        form.setFieldValue('coverageArea', coverageArea as any)
                      }
                    }}
                    className={cn(
                      'bg-background/10 text-foreground hover:bg-primary/20 flex flex-1/2 items-center justify-between gap-4 border py-8 text-center text-base shadow-none',
                      {
                        'bg-primary hover:bg-primary sticky top-0 text-white':
                          isSelected,
                      }
                    )}
                  >
                    <div className="flex w-1/4 items-center gap-4 border-r text-lg">
                      <Check
                        className={cn(
                          'size-4 opacity-0 transition-all duration-300 ease-in',
                          {
                            'opacity-100': isSelected,
                          }
                        )}
                      />
                      {country.flag}
                    </div>

                    <span className="w-full text-left">{country.name}</span>
                  </Button>
                )
              })
            ) : (
              <div className="flex w-full items-center justify-center">
                <p>No found destination</p>
              </div>
            )}
          </TabsContent>
        ))}
      </ScrollArea>
    </div>
  )
}
