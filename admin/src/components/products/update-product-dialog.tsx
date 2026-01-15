'use client'

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Pencil, Search, Check } from 'lucide-react'
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
import { useUpdateProduct } from '@/app/data/mutations/products'
import { CreateProductRequest } from '@/types/products'
import { useGetProviders } from '@/app/data/queries/provider'
import { useGetLineOfBusinessList } from '@/app/data/queries/line-of-business'
import { Provider } from '@/types/provider'
import { LineOfBusiness } from '@/types/line-of-business'
import { cn } from '@/lib/utils'

const updateProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(1, 'Price must be at least 1'),
  provider_id: z.number().min(1, 'Please select a provider'),
  lob_id: z.number().min(1, 'Please select a line of business'),
  status: z.enum(['active', 'inactive']),
  carrier_product_code: z.string().min(1, 'Carrier product code is required'),
})

type UpdateProductForm = z.infer<typeof updateProductSchema>

interface ProductWithCommission {
  id: number | string
  name: string
  description: string
  price: number
  provider_id: number
  lob_id: number
  status: 'active' | 'inactive'
  carrier_product_code: string
  provider?: Provider
  lob?: LineOfBusiness
}

interface UpdateProductDialogProps {
  product: ProductWithCommission
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function UpdateProductDialog({
  product,
  onSuccess,
  trigger,
}: UpdateProductDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providerSearch, setProviderSearch] = useState(
    product.provider?.name || ''
  )
  const [providerSearchDebounced, setProviderSearchDebounced] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    product.provider || null
  )
  const [showProviderResults, setShowProviderResults] = useState(false)

  const [lobSearch, setLobSearch] = useState(product.lob?.name || '')
  const [lobSearchDebounced, setLobSearchDebounced] = useState('')
  const [selectedLob, setSelectedLob] = useState<LineOfBusiness | null>(
    product.lob || null
  )
  const [showLobResults, setShowLobResults] = useState(false)

  const { mutateAsync: updateProduct } = useUpdateProduct()

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
      name: product.name,
      description: product.description,
      price: product.price,
      provider_id: product.provider_id,
      lob_id: product.lob_id,
      status: product.status,
      carrier_product_code: product.carrier_product_code,
    } as UpdateProductForm,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const productPayload: CreateProductRequest = {
          name: value.name,
          description: value.description,
          price: value.price,
          provider_id: value.provider_id,
          lob_id: value.lob_id,
          status: value.status,
          carrier_product_code: value.carrier_product_code,
        }

        const productResponse = await updateProduct({
          productId: product.id,
          payload: productPayload,
        })

        if (!productResponse?.success) {
          toast.error(productResponse?.message || 'Failed to update product')
          return
        }

        toast.success('Product updated successfully!')
        setDialogOpen(false)
        onSuccess?.()
      } catch (error) {
        console.error('Error updating product:', error)
        toast.error('An error occurred while updating the product')
      } finally {
        setIsSubmitting(false)
      }
    },
    validators: {
      onSubmit: updateProductSchema,
    },
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Product</DialogTitle>
          <DialogDescription>Update product information</DialogDescription>
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

                      {showProviderResults && (
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
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
