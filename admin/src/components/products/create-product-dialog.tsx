'use client'

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
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
import { useCreateCommissionConfiguration } from '@/app/data/mutations/commission'
import { CreateProductRequest } from '@/types/products'
import { CreateCommitionConfigRequest } from '@/types/commission'
import { useGetProviders } from '@/app/data/queries/provider'
import { Provider } from '@/types/provider'
import { cn } from '@/lib/utils'

const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(1, 'Price must be at least 1'),
  provider_id: z.number().min(1, 'Please select a provider'),
  status: z.enum(['active', 'inactive']),
  carrier_product_code: z.string().min(1, 'Carrier product code is required'),
  // Commission fields
  base_commission: z
    .number()
    .min(0, 'Base commission must be at least 0%')
    .max(30, 'Base commission cannot exceed 30%'),
  agent_commission: z
    .number()
    .min(0, 'Agent commission must be at least 0%')
    .max(15, 'Agent commission cannot exceed 15%'),
  agent_overriders_commission: z
    .number()
    .min(0, 'Agent overrider commission must be at least 0%')
    .max(10, 'Agent overrider commission cannot exceed 10%'),
  ifrc_admin: z
    .number()
    .min(0, 'IFRC Admin commission must be at least 0%')
    .max(15, 'IFRC Admin commission cannot exceed 15%'),
  ifrc_overrider_commission: z
    .number()
    .min(0, 'IFRC Admin overrider commission must be at least 0%')
    .max(10, 'IFRC Admin overrider commission cannot exceed 10%'),
  ifrc_digitech: z
    .number()
    .min(0, 'IFRC Digitech commission must be at least 0%')
    .max(25, 'IFRC Digitech commission cannot exceed 25%'),
  digitech_referral: z
    .number()
    .min(0, 'Referral commission must be at least 0%')
    .max(5, 'Referral commission cannot exceed 5%'),
  digitech_overriders: z
    .number()
    .min(0, 'Referral overrider commission must be at least 0%')
    .max(10, 'Referral overrider commission cannot exceed 10%'),
  effectivity_date: z.string().min(1, 'Please select an effectivity date'),
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

  const { mutateAsync: createProduct } = useCreateProduct()
  const { mutateAsync: createCommissionConfig } =
    useCreateCommissionConfiguration()

  const { data: providersData } = useGetProviders(1, providerSearchDebounced)
  const providers = providersData?.data.data || []

  // Debounce provider search
  useEffect(() => {
    const timer = setTimeout(() => {
      setProviderSearchDebounced(providerSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [providerSearch])

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      provider_id: 0,
      status: 'active' as const,
      carrier_product_code: '',
      base_commission: 15,
      agent_commission: 8,
      agent_overriders_commission: 2.5,
      ifrc_admin: 1,
      ifrc_overrider_commission: 1.5,
      ifrc_digitech: 0.75,
      digitech_referral: 1,
      digitech_overriders: 0.75,
      effectivity_date: new Date().toISOString().split('T')[0],
    } as CreateProductForm,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        // Step 1: Create the product
        const productPayload: CreateProductRequest = {
          name: value.name,
          description: value.description,
          price: value.price,
          provider_id: value.provider_id,
          status: value.status,
          carrier_product_code: value.carrier_product_code,
        }

        const productResponse = await createProduct(productPayload)

        if (!productResponse.success) {
          toast.error(productResponse.message || 'Failed to create product')
          return
        }

        // Step 2: Create commission configuration using the product ID
        const commissionPayload: CreateCommitionConfigRequest = {
          product_id: Number(productResponse.data.id),
          base_commission: value.base_commission,
          agent_commission: value.agent_commission,
          agent_overriders_commission: value.agent_overriders_commission,
          ifrc_admin: value.ifrc_admin,
          ifrc_overrider_commission: value.ifrc_overrider_commission,
          ifrc_digitech: value.ifrc_digitech,
          digitech_referral: value.digitech_referral,
          digitech_overriders: value.digitech_overriders,
          effectivity_date: value.effectivity_date,
          status: 'active',
        }

        const commissionResponse =
          await createCommissionConfig(commissionPayload)

        if (!commissionResponse.success) {
          toast.error(
            commissionResponse.message ||
              'Product created but failed to create commission configuration'
          )
          return
        }

        toast.success(
          'Product and commission configuration created successfully!'
        )
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
        <Button className="rounded-full bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Create a new insurance product with commission configuration
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
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

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="price">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price (₱) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={field.state.value || ''}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <form.Field name="carrier_product_code">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="carrier_product_code">
                      Carrier Product Code
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
            </div>
          </div>

          {/* Commission Configuration Section */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-lg font-semibold">
                Commission Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                Configure commission rates for this product
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="base_commission">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="base_commission">
                      Base Commission (%){' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="base_commission"
                      type="number"
                      min="0"
                      max="30"
                      step="0.01"
                      value={field.state.value || ''}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="effectivity_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="effectivity_date">
                      Effectivity Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="effectivity_date"
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>

            {/* Agent-based Commission */}
            <div className="space-y-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <h4 className="font-semibold">Agent-based Sales Commission</h4>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="agent_commission">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="agent_commission">Agent (%)</Label>
                      <Input
                        id="agent_commission"
                        type="number"
                        min="0"
                        max="15"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="agent_overriders_commission">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="agent_overriders_commission">
                        Agent Overrider (%)
                      </Label>
                      <Input
                        id="agent_overriders_commission"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="ifrc_admin">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="ifrc_admin">IFRC Admin (%)</Label>
                      <Input
                        id="ifrc_admin"
                        type="number"
                        min="0"
                        max="15"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="ifrc_overrider_commission">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="ifrc_overrider_commission">
                        IFRC Admin Overrider (%)
                      </Label>
                      <Input
                        id="ifrc_overrider_commission"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            {/* DigiTech-based Commission */}
            <div className="space-y-3 rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
              <h4 className="font-semibold">DigiTech-based Sales Commission</h4>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="ifrc_digitech">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="ifrc_digitech">IFRC DigiTech (%)</Label>
                      <Input
                        id="ifrc_digitech"
                        type="number"
                        min="0"
                        max="25"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="digitech_referral">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="digitech_referral">Referral (%)</Label>
                      <Input
                        id="digitech_referral"
                        type="number"
                        min="0"
                        max="5"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="digitech_overriders">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="digitech_overriders">
                        Referral Overrider (%)
                      </Label>
                      <Input
                        id="digitech_overriders"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={field.state.value || ''}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !form.state.canSubmit}
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
