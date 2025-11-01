'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Shield, ChevronDown, User } from 'lucide-react'
import { TravelPolicyData } from '@/types/quote'

type PolicyLobList = TravelPolicyData['PolicyLobList']

interface CoverageDetailsCardProps {
  risks: PolicyLobList[number]['PolicyRiskList']
}

export function CoverageDetailsCard({ risks }: CoverageDetailsCardProps) {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <Card className="w-full gap-2 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold">
          <Shield className="text-primary h-5 w-5" />
          Coverage Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {risks.map((risk) => (
            <Collapsible
              key={risk.PolicyElementId}
              open={openItems.includes(risk.PolicyElementId)}
              onOpenChange={() => toggleItem(risk.PolicyElementId)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="bg-muted/50 hover:bg-muted/70 flex items-center justify-between rounded-lg p-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <User className="text-primary h-4 w-4" />
                    <div className="text-left">
                      <h3 className="font-semibold">{risk.InsuredName}</h3>
                      <p className="text-muted-foreground text-sm">
                        Age: {risk.Age} •{' '}
                        {risk.IsMainInsured === 'Y'
                          ? 'Main Insured'
                          : 'Additional Insured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {risk.PolicyCoverageList.length} Coverage
                      {risk.PolicyCoverageList.length !== 1 ? 's' : ''}
                    </Badge>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openItems.includes(risk.PolicyElementId)
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="bg-card mt-2 space-y-4 rounded-lg">
                  <h4 className="mb-3 font-medium">Coverage List</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {risk.PolicyCoverageList.map((coverage) => (
                      <div
                        key={coverage.PolicyElementId}
                        className="bg-muted/50 border-muted-foreground/20 rounded border p-3"
                      >
                        <h5 className="text-sm font-bold">
                          {coverage.CoverageName}
                        </h5>
                        <div className="text-muted-foreground mt-1 text-xs">
                          <p>Code: {coverage.ProductElementCode}</p>
                          <p>
                            Final Level:{' '}
                            {coverage.IsFinalLevelCt === 'Y' ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
