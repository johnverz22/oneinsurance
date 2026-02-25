'use client'

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Plus, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { FieldInfo } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useCreateProduct } from '@/app/data/mutations/products'
import { CreateProductRequest } from '@/types/products'
import { useGetProviders } from '@/app/data/queries/provider'
import { useGetLineOfBusinessList } from '@/app/data/queries/line-of-business'
import { Provider } from '@/types/provider'
import { LineOfBusiness } from '@/types/line-of-business'
import { cn } from '@/lib/utils'
import { useCreateCommissionConfiguration } from '@/app/data/mutations/commission'
import { CreateCommitionConfigRequest } from '@/types/commission'

const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  provider_id: z.number().min(1, 'Please select a provider'),
  lob_id: z.number().min(1, 'Please select a line of business'),
  status: z.enum(['active', 'inactive']),
  carrier_product_code: z.string().min(1, 'Carrier product code is required'),
})

type CreateProductForm = z.infer<typeof createProductSchema>

interface CreateProductDialogProps {
  onSuccess?: () => void
}

export default function CreateProductDialog({
  onSuccess,
}: CreateProductDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providerSearch, setProviderSearch] = useState('')
  const [providerSearchDebounced, setProviderSearchDebounced] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  )
  const [showProviderResults, setShowProviderResults] = useState(false)

  const [lobSearch, setLobSearch] = useState('')
  const [lobSearchDebounced, setLobSearchDebounced] = useState('')
  const [selectedLob, setSelectedLob] = useState<LineOfBusiness | null>(null)
  const [showLobResults, setShowLobResults] = useState(false)

  const { mutateAsync: createProduct } = useCreateProduct()
  const { mutateAsync: createCommissionConfig } = useCreateCommissionConfiguration()

  const { data: providersData } = useGetProviders(1, providerSearchDebounced)
  const providers = providersData?.data.data || []

  const { data: lobData } = useGetLineOfBusinessList({
    page: 1,
    per_page: 15,
    name: lobSearchDebounced || undefined,
    status: 'active',
  })
  const lineOfBusinessList = lobData?.data?.data || []

  // Debounce provider search
  useEffect(() => {
    const timer = setTimeout(() => {
      setProviderSearchDebounced(providerSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [providerSearch])

  // Debounce LOB search
  useEffect(() => {
    const timer = setTimeout(() => {
      setLobSearchDebounced(lobSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [lobSearch])

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      provider_id: 0,
      lob_id: 0,
      status: 'active' as const,
      carrier_product_code: '',
    } as CreateProductForm,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        // Create the product
        const productPayload: CreateProductRequest = {
          name: value.name,
          description: value.description,
          price: 0, // Default price
          provider_id: value.provider_id,
          lob_id: value.lob_id,
          status: value.status,
          carrier_product_code: value.carrier_product_code,
        }

        const productResponse = await createProduct(productPayload)

        if (!productResponse.success) {
          toast.error(productResponse.message || 'Failed to create product')
          return
        }

        // Get the created product ID
        const createdProductId = productResponse.data.id

        // Create default commission configuration
        const commissionPayload: CreateCommitionConfigRequest = {
          product_id: Number(createdProductId),
          base_commission: 30,
          agent_commission: 15,
          agent_overrider_commission: 10,
          agent_admin_commission: 15,
          agent_admin_overrider_commission: 10,
          referral_commission: 25,
          referral_overrider_commission: 5,
          referral_admin_commission: 10,
          referral_admin_overrider_commission: 5,
          vat: 12,
          witholding_tax: 10,
          gross_vat: 0,
          vatOptions: 'DEDUCT',
          effectivity_date: new Date().toISOString().split('T')[0], // Today's date
          status: 'active',
        }

        const commissionResponse = await createCommissionConfig(commissionPayload)

        if (!commissionResponse?.success) {
          toast.warning('Product created, but failed to create default commission configuration. Please configure manually.')
        } else {
          toast.success('Product and commission configuration created successfully!')
        }

        form.reset()
        setDialogOpen(false)
        onSuccess?.()
      } catch (error) {
        console.error('Error creating product:', error)
        toast.error('An error occurred while creating the product')
      } finally {
        setIsSubmitting(false)
      }
    },
    validators: {
      onSubmit: createProductSchema,
    },
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center rounded-full border border-transparent bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Add New Product
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0" showCloseButton={false}>
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Create a new insurance product
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Product Information Section */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Information</h3>

            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Family Health Care Plan"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the product features and benefits..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    rows={4}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="carrier_product_code">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="carrier_product_code">
                    Carrier Product Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="carrier_product_code"
                    placeholder="Enter carrier product code"
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="provider_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="provider_id">
                      Provider <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="provider_id"
                          placeholder="Search provider..."
                          value={selectedProvider?.name || providerSearch}
                          onChange={(e) => {
                            setProviderSearch(e.target.value)
                            setSelectedProvider(null)
                            field.handleChange(0)
                            setShowProviderResults(true)
                          }}
                          onFocus={() => setShowProviderResults(true)}
                          className="pl-10"
                        />
                      </div>

                      {showProviderResults && providerSearch && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg dark:bg-gray-950">
                          {providers.length > 0 ? (
                            providers.map((provider) => (
                              <div
                                key={provider.id}
                                className={cn(
                                  'flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
                                  selectedProvider?.id === provider.id &&
                                    'bg-blue-50 dark:bg-blue-950'
                                )}
                                onClick={() => {
                                  setSelectedProvider(provider)
                                  setProviderSearch(provider.name)
                                  field.handleChange(provider.id)
                                  setShowProviderResults(false)
                                }}
                              >
                                <span>{provider.name}</span>
                                {selectedProvider?.id === provider.id && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No providers found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="lob_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="lob_id">
                      Line of Business <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="lob_id"
                          placeholder="Search line of business..."
                          value={selectedLob?.name || lobSearch}
                          onChange={(e) => {
                            setLobSearch(e.target.value)
                            setSelectedLob(null)
                            field.handleChange(0)
                            setShowLobResults(true)
                          }}
                          onFocus={() => setShowLobResults(true)}
                          className="pl-10"
                        />
                      </div>

                      {showLobResults && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg dark:bg-gray-950">
                          {lineOfBusinessList.length > 0 ? (
                            lineOfBusinessList.map((lob) => (
                              <div
                                key={lob.id}
                                className={cn(
                                  'flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
                                  selectedLob?.id === lob.id &&
                                    'bg-blue-50 dark:bg-blue-950'
                                )}
                                onClick={() => {
                                  setSelectedLob(lob)
                                  setLobSearch(lob.name)
                                  field.handleChange(lob.id)
                                  setShowLobResults(false)
                                }}
                              >
                                <span>{lob.name}</span>
                                {selectedLob?.id === lob.id && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No line of business found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="status">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: 'active' | 'inactive') =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          {/* Commission Note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Default Commission Configuration
                </h4>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  A default commission configuration will be automatically created with this product. You can adjust the rates in the{' '}
                  <span className="font-semibold">Commissions Page</span> after creation.
                </p>
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  <p>Default rates: Base 30%, Agent 15%, Admin 15%</p>
                </div>
              </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => form.handleSubmit()}
              className="rounded-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !form.state.canSubmit}
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
