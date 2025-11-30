import React, { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { X, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { MultiSelect } from '@/components/ui/multi-select'
import { ScrollArea } from '../ui/scroll-area'
import { searchProducts, useGetProducts } from '@/app/data/queries/products'
import { Popover } from '../ui/popover'
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Product, ProductsPaginatedResponse } from '@/types/products'
import { useSearchAgents } from '@/app/data/mutations/agents'
import { AgentsResponse, AssignProductAgentPayload } from '@/types/agents'
import { toast } from 'sonner'
import { useAssignProductsToAgent } from '@/app/data/mutations/products'

const assignProductsSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, 'Please select at least one product'),
  agents: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, 'Please select at least one agent'),
  effectiveDate: z.string().min(1, 'Please select an effective date'),
  permissions: z.object({
    allowSellingProducts: z.boolean(),
    viewSalesAnalytics: z.boolean(),
    recruitOverriders: z.boolean(),
    manageReferralLinks: z.boolean(),
  }),
  notes: z.string().optional(),
})

type AssignProductsForm = z.infer<typeof assignProductsSchema>

export default function AssignProductDialog() {
  const [queryProducts, setQueryProducts] = useState('')
  const [queryProductsDebounced, setQueryProductsDebounced] = useState('')
  const [queryAgents, setQueryAgents] = useState('')
  const [agentsPopoverOpen, setAgentsPopoverOpen] = useState(false)
  const [agentsSearchResults, setAgentsSearchResults] =
    useState<AgentsResponse>()
  const [productsPopoverOpen, setProductsPopoverOpen] = useState(false)
  const { mutateAsync: assignProductsToAgent } = useAssignProductsToAgent()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      products: [],
      agents: [],
      effectiveDate: '',
      permissions: {
        allowSellingProducts: true,
        viewSalesAnalytics: true,
        recruitOverriders: true,
        manageReferralLinks: true,
      },
      notes: '',
    } as AssignProductsForm,
    onSubmit: async ({ value }) => {
      const result: AssignProductAgentPayload[] = []
      value.products.forEach((product) => {
        value.agents.forEach((agent) => {
          result.push({
            agent_id: agent.id,
            product_id: product.id,
            commission_rate: 25.0,
            status: 'active',
          })
        })
      })

      result.forEach(async (payload) => {
        await assignProductsToAgent(payload)
      })
      toast.success('Products assigned successfully!')
      setDialogOpen(false)
    },
    validators: {
      onSubmit: assignProductsSchema,
    },
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryProducts.length > 0) {
        setQueryProductsDebounced(queryProducts)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [queryProducts])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (queryAgents.length > 0) {
        const result = await searchAgents({ searchKey: queryAgents })
        setAgentsSearchResults(result)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [queryAgents])

  const { data: products } = searchProducts(queryProductsDebounced)
  const { mutateAsync: searchAgents } = useSearchAgents()

  const handleDraftAssignment = () => {
    toast.info('Draft feature coming soon!')
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center rounded-full border border-transparent bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Assign Products
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80%]">
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <ScrollArea className="max-h-[80%]">
          <div className="mx-auto max-w-2xl overflow-y-auto rounded-lg shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-6">
              <h1 className="text-2xl font-semibold">Assign Products</h1>
            </div>

            {/* Form Content */}
            <div className="space-y-6 p-6">
              {/* Product and Agent Selection Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Select Product/s */}
                <div className="flex flex-col gap-2">
                  <form.Field
                    name="products"
                    validators={{
                      onChange: assignProductsSchema.shape.products,
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label
                          htmlFor={field.name}
                          className="mb-2 block text-sm font-medium"
                        >
                          Select Product/s
                        </Label>
                        <Popover
                          open={productsPopoverOpen}
                          onOpenChange={setProductsPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Search products..."
                                value={queryProducts}
                                onChange={(e) =>
                                  setQueryProducts(e.target.value)
                                }
                                onFocus={() => {
                                  if (queryProducts.trim().length > 0) {
                                    setProductsPopoverOpen(true)
                                  }
                                }}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="bg-card w-[300px] rounded-lg border-1 p-2 shadow-lg"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            {products &&
                              products.data.data.map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    const currentProducts =
                                      (field.state.value as {
                                        id: number
                                        name: string
                                      }[]) || []
                                    const pid = Number(product.id)
                                    const isSelected = currentProducts.some(
                                      (p) => p.id === pid
                                    )
                                    let updatedProducts: {
                                      id: number
                                      name: string
                                    }[]
                                    if (isSelected) {
                                      updatedProducts = currentProducts.filter(
                                        (p) => p.id !== pid
                                      )
                                    } else {
                                      updatedProducts = [
                                        ...currentProducts,
                                        { id: pid, name: product.name },
                                      ]
                                    }
                                    field.handleChange(updatedProducts)
                                    setProductsPopoverOpen(false)
                                  }}
                                >
                                  {product.name}
                                </div>
                              ))}
                            {(!products ||
                              products?.data.data.length === 0) && (
                              <div>No products found.</div>
                            )}
                          </PopoverContent>
                        </Popover>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                  <div className="flex flex-wrap gap-2">
                    {form.getFieldValue('products').length > 0 &&
                      form.getFieldValue('products').map((product) => (
                        <div
                          key={product.id}
                          className="rounded-full border-2 px-2 py-1 text-sm"
                        >
                          {product.name}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Assign To */}
                <div className="flex flex-col gap-2">
                  <form.Field
                    name="agents"
                    validators={{
                      onChange: assignProductsSchema.shape.agents,
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label
                          htmlFor={field.name}
                          className="mb-2 block text-sm font-medium"
                        >
                          Select Agent/s
                        </Label>
                        <Popover
                          open={agentsPopoverOpen}
                          onOpenChange={setAgentsPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Search agents..."
                                value={queryAgents}
                                onChange={(e) => setQueryAgents(e.target.value)}
                                onFocus={() => {
                                  if (queryAgents.trim().length > 0) {
                                    setAgentsPopoverOpen(true)
                                  }
                                }}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="bg-card w-[300px] rounded-lg border-1 p-2 shadow-lg"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            {agentsSearchResults &&
                              agentsSearchResults.data.data.map((agent) => (
                                <div
                                  key={agent.id}
                                  onClick={() => {
                                    const currentAgents =
                                      (field.state.value as {
                                        id: number
                                        name: string
                                      }[]) || []
                                    const aid = Number(agent.id)
                                    const isSelected = currentAgents.some(
                                      (a) => a.id === aid
                                    )
                                    let updatedAgents: {
                                      id: number
                                      name: string
                                    }[]
                                    if (isSelected) {
                                      updatedAgents = currentAgents.filter(
                                        (a) => a.id !== aid
                                      )
                                    } else {
                                      updatedAgents = [
                                        ...currentAgents,
                                        {
                                          id: aid,
                                          name: `${agent.first_name} ${agent.middle_name ?? ''} ${agent.last_name}`,
                                        },
                                      ]
                                    }
                                    field.handleChange(updatedAgents)
                                    setAgentsPopoverOpen(false)
                                  }}
                                >
                                  {agent.first_name} {agent.middle_name ?? ''}{' '}
                                  {agent.last_name}
                                </div>
                              ))}
                            {(!agentsSearchResults ||
                              agentsSearchResults.data.data.length === 0) && (
                              <div>No agents found.</div>
                            )}
                          </PopoverContent>
                        </Popover>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                  <div className="flex flex-wrap gap-2">
                    {form.getFieldValue('agents').length > 0 &&
                      form.getFieldValue('agents').map((agent) => (
                        <div
                          key={agent.id}
                          className="rounded-full border-2 px-2 py-1 text-sm"
                          onClick={() => {
                            const currentAgents = form.getFieldValue('agents')
                            // Remove agent on click
                            const updatedAgents = currentAgents.filter(
                              (a) => a.id !== agent.id
                            )
                            form.setFieldValue('agents', updatedAgents)
                          }}
                        >
                          {agent.name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Effective Date */}
              <form.Field
                name="effectiveDate"
                validators={{
                  onChange: assignProductsSchema.shape.effectiveDate,
                }}
              >
                {(field) => (
                  <div>
                    <Label
                      htmlFor="effectiveDate"
                      className="mb-2 block text-sm font-medium"
                    >
                      Effective Date
                    </Label>
                    <div className="relative max-w-xs">
                      <Input
                        id="effectiveDate"
                        type="date"
                        placeholder="MM/DD/YYYY"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full pr-10"
                      />
                      <Calendar className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Assignment Permissions */}
              <div>
                <h3 className="mb-3 text-sm font-medium">
                  Assignment Permissions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="permissions.allowSellingProducts">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowSellingProducts"
                          checked={field.state.value}
                          onCheckedChange={(checked) =>
                            field.handleChange(!!checked)
                          }
                        />
                        <label
                          htmlFor="allowSellingProducts"
                          className="cursor-pointer text-sm"
                        >
                          Allow selling products
                        </label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="permissions.recruitOverriders">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="recruitOverriders"
                          checked={field.state.value}
                          onCheckedChange={(checked) =>
                            field.handleChange(!!checked)
                          }
                        />
                        <Label
                          htmlFor="recruitOverriders"
                          className="cursor-pointer text-sm"
                        >
                          Recruit overriders
                        </Label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="permissions.viewSalesAnalytics">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="viewSalesAnalytics"
                          checked={field.state.value}
                          onCheckedChange={(checked) =>
                            field.handleChange(!!checked)
                          }
                        />
                        <Label
                          htmlFor="viewSalesAnalytics"
                          className="cursor-pointer text-sm"
                        >
                          View sales analytics
                        </Label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="permissions.manageReferralLinks">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="manageReferralLinks"
                          checked={field.state.value}
                          onCheckedChange={(checked) =>
                            field.handleChange(!!checked)
                          }
                        />
                        <Label
                          htmlFor="manageReferralLinks"
                          className="cursor-pointer text-sm"
                        >
                          Manage referral links
                        </Label>
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>

              {/* Assignment Notes */}
              <form.Field name="notes">
                {(field) => (
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      Assignment Notes
                    </Label>
                    <Textarea
                      placeholder="Add any special instruction or notes for this assignment..."
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={4}
                      className="w-full resize-none"
                    />
                  </div>
                )}
              </form.Field>

              {/* Product Assignment Preview */}
              <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h3 className="text-sm font-medium">
                  Product Assignment Preview
                </h3>
                <ul className="list-disc space-y-1 pl-2 text-sm">
                  <li>
                    <form.Subscribe>
                      {(field) => field.values.products.length}
                    </form.Subscribe>{' '}
                    products will be assigned to{' '}
                    <form.Subscribe>
                      {(field) => field.values.agents.length}
                    </form.Subscribe>{' '}
                    agents
                  </li>
                  <li>
                    Agents will receive email notifications about new product
                    assignments
                  </li>
                  <li>
                    Commission structures will be applied based on existing
                    configurations
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDraftAssignment}
                  className="px-6"
                >
                  Draft Assignment
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                  }}
                  className="bg-green-600 px-6 text-white hover:bg-green-700"
                >
                  Assign Products
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
