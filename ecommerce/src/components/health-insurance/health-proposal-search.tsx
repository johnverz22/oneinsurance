'use client'

import { useState, useRef } from 'react'
import { Search, Loader2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useRouter, useParams } from 'next/navigation'

export function HealthProposalSearch() {
  const [proposalNumber, setProposalNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isProcessingRef = useRef(false)
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string

  const { setProposalNo } = useHealthCartStore()
  const { setStep } = useHealthAvailStore()

  const handleSearch = async () => {
    if (!proposalNumber.trim()) {
      toast.error('Please enter a proposal number')
      return
    }
    if (isProcessingRef.current || isLoading) return

    setErrorMessage(null)
    setIsLoading(true)
    isProcessingRef.current = true

    try {
      const response = await fetch('/api/health-insurance/load-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProposalNo: proposalNumber.trim() }),
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.status === 422) {
        setErrorMessage(data.error || data.message || 'This proposal cannot be processed.')
        return
      }

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || data.message || 'Proposal not found. Please check the proposal number.')
        return
      }

      const proposalData = data.data ?? data
      const dataKeys = Object.keys(proposalData)

      if (dataKeys.length === 1 && dataKeys[0] === 'ValidateResult') {
        const validateResult = proposalData.ValidateResult
        const firstError = validateResult?.ErrorMessage?.[0]
        setErrorMessage(firstError?.message || firstError?.Message || 'Proposal not found.')
        return
      }

      // Check if policy already issued
      const hasPolicy = !!proposalData.CarrierPolicyNo
      if (hasPolicy) {
        toast.success('Policy already issued for this proposal.')
        // Could show a success screen here — for now just notify
        return
      }

      // Load the proposal into the store and navigate to avail at step 3 (review)
      setProposalNo(proposalData.ProposalNo)
      setStep(3)
      router.push(`/${agentCode}/products/health-insurance/avail?proposal=${proposalData.ProposalNo}`)
      toast.success('Proposal loaded!')
    } catch (error) {
      setErrorMessage('Failed to load proposal. Please try again.')
    } finally {
      setIsLoading(false)
      setTimeout(() => { isProcessingRef.current = false }, 2000)
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Have an existing proposal?</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your proposal number to retrieve your saved quote and continue to payment.
            </p>
          </div>

          {errorMessage && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-destructive">{errorMessage}</span>
                <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="ml-2 h-6 w-6 p-0 text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Enter proposal number (e.g., PHEALTH0000000030)"
              value={proposalNumber}
              onChange={(e) => { setProposalNumber(e.target.value); if (errorMessage) setErrorMessage(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              disabled={isLoading}
              className="h-12"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !proposalNumber.trim()}
              className="from-primary to-accent h-12 rounded-full bg-gradient-to-r px-6 font-semibold text-white"
              size="lg"
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : 'Search'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
