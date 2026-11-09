'use client'

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldInfo } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const agentRestrictionSchema = z.object({
  agent_id: z.number().min(1, 'Agent is required'),
  restriction_type: z.enum(
    ['excluded', 'limited', 'manual_approval_required'],
    {
      required_error: 'Restriction type is required',
    }
  ),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  is_active: z.boolean(),
})

type AgentRestrictionFormData = z.infer<typeof agentRestrictionSchema>

interface Agent {
  id: number
  name: string
}

interface AgentRestrictionFormProps {
  initialData?: Partial<AgentRestrictionFormData>
  agents: Agent[]
  onSubmit: (values: AgentRestrictionFormData) => Promise<void>
  isEditing?: boolean
}

export const AgentRestrictionForm = ({
  initialData,
  agents,
  onSubmit,
  isEditing = false,
}: AgentRestrictionFormProps) => {
  const form = useForm({
    defaultValues: {
      agent_id: initialData?.agent_id || 0,
      restriction_type: initialData?.restriction_type || 'excluded',
      reason: initialData?.reason || '',
      is_active: initialData?.is_active ?? true,
    } as AgentRestrictionFormData,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
    validators: {
      onChange: agentRestrictionSchema,
    },
  })

  const restrictionTypes = [
    { value: 'excluded', label: 'Excluded' },
    { value: 'limited', label: 'Limited' },
    { value: 'manual_approval_required', label: 'Manual Approval Required' },
  ]

  return (
    <div className="space-y-4">
      {!isEditing && (
        <form.Field name="agent_id">
          {(field) => (
            <div className="space-y-2">
              <label htmlFor="agent" className="text-sm font-medium">
                Agent
              </label>
              <Input
                id="agent"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="restriction_type">
        {(field) => (
          <div className="space-y-2">
            <label className="text-sm font-medium">Restriction Type</label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as any)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select restriction type" />
              </SelectTrigger>
              <SelectContent>
                {restrictionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="reason">
        {(field) => (
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <textarea
              className="border-input bg-background w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="Explain the reason for this restriction..."
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="is_active">
        {(field) => (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              className="border-input size-4 rounded"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active Restriction
            </label>
          </div>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-4">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              onClick={() => form.handleSubmit()}
              disabled={!canSubmit}
              className="px-8"
            >
              {isSubmitting ? 'Submitting...' : isEditing ? 'Update' : 'Create'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </div>
  )
}
