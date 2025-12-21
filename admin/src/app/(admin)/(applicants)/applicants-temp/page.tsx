'use client'

import { useGetApplicants } from '@/app/data/queries/applicant'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { Applicant } from '@/types/applicant'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FieldInfo } from '@/components/ui/form'
import { useCreateInterview } from '@/app/data/mutations/interview'
import {
  mapScheduleInterviewToCreateRequest,
  ScheduleInterviewForm,
} from '@/types/interview'
import { useAuthStore } from '@/store/auth-store'

const scheduleInterviewSchema = z.object({
  interviewDate: z.date({
    required_error: 'Please select an interview date',
  }),
  interviewTime: z.string().min(1, 'Please select an interview time'),
  notes: z.string().optional(),
})

export default function PendingApplicants() {
  const [page, setPage] = useState(1)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const { mutateAsync: createInterview } = useCreateInterview()
  const { user } = useAuthStore()

  const { data: applicantsData } = useGetApplicants({ page })

  const form = useForm({
    defaultValues: {
      interviewDate: undefined as Date | undefined,
      interviewTime: '',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      if (!selectedApplicant) {
        toast.error('Please select an applicant')
        return
      }
      if (!value.interviewDate) {
        toast.error('Please select an interview date')
        return
      }
      if (!value.interviewTime) {
        toast.error('Please select an interview time')
        return
      }

      try {
        const requestData = mapScheduleInterviewToCreateRequest(
          value as ScheduleInterviewForm,
          selectedApplicant.id,
          user?.id || 1
        )
        console.log('Request Data:', requestData)

        await createInterview(requestData)
        toast.success('Interview scheduled successfully!')
        form.reset()
        setSelectedDate(undefined)
      } catch (error) {
        toast.error('Failed to schedule interview. Please try again.')
        console.error('Error scheduling interview:', error)
      }
    },
  })

  const pendingApplicants = applicantsData?.data.data

  const totalPages = applicantsData?.data.last_page || 1
  const currentPage = applicantsData?.data.current_page || 1

  const handleJoinInterview = (applicant: Applicant) => {
    // TODO: Implement join interview logic
    toast.info('Join interview feature coming soon!')
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left side - Applicants List */}
      <div className="lg:col-span-1">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Pending Applicants</h2>
        </div>

        {!pendingApplicants || pendingApplicants.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No pending applicants at this time.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pendingApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                    selectedApplicant?.id === applicant.id
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                      : 'hover:border-blue-500 dark:hover:border-blue-400'
                  }`}
                  onClick={() => setSelectedApplicant(applicant)}
                >
                  <h3 className="text-base font-bold">{applicant.first_name} {applicant.last_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {applicant.email}
                  </p>
                  <span className="mt-2 inline-block text-xs text-orange-600 dark:text-orange-400">
                    {applicant.application_type} - {applicant.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right side - Schedule Interview */}
      <div className="lg:col-span-2">
        {selectedApplicant ? (
          <div className="rounded-lg border p-6">
            <div className="mb-6 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h2 className="text-xl font-bold">Schedule Interview</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Applicant Details */}
              <div className="col-span-1 space-y-6">
                <div>
                  <h3 className="mb-4 text-base font-semibold">Applicant</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">
                        Name:
                      </Label>
                      <p className="text-sm dark:text-gray-200">
                        {selectedApplicant.first_name} {selectedApplicant.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">
                        Email Address:
                      </Label>
                      <p className="text-sm dark:text-gray-200">
                        {selectedApplicant.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">
                        Phone Number:
                      </Label>
                      <p className="text-sm dark:text-gray-200">
                        {selectedApplicant.contact_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">
                        Application Type:
                      </Label>
                      <p className="text-sm dark:text-gray-200">
                        {selectedApplicant.application_type}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">
                    Bank Details
                  </Label>
                  <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-400 dark:bg-gray-900 dark:text-gray-500">
                    Information will be available after approval
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">
                    ID Verification Details
                  </Label>
                  <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-400 dark:bg-gray-900 dark:text-gray-500">
                    ID verification pending
                  </div>
                </div>
              </div>

              {/* Right Column - Calendar and Notes */}
              <div className="col-span-2 space-y-6">
                <form.Field
                  name="interviewDate"
                  validators={{
                    onChange: scheduleInterviewSchema.shape.interviewDate,
                  }}
                >
                  {(field) => (
                    <div>
                      <div className="rounded-lg border p-4">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date)
                            field.handleChange(date)
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          className="w-full"
                        />
                      </div>
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="interviewTime"
                  validators={{
                    onChange: scheduleInterviewSchema.shape.interviewTime,
                  }}
                >
                  {(field) => (
                    <div>
                      <Label
                        htmlFor="interview-time"
                        className="mb-2 block text-sm"
                      >
                        Interview Time
                      </Label>
                      <Input
                        id="interview-time"
                        type="time"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="notes">
                  {(field) => (
                    <div>
                      <Label htmlFor="notes" className="mb-2 block text-sm">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Optional Notes..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                {/* Action Buttons */}
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleJoinInterview(selectedApplicant)}
                    className="rounded-full"
                  >
                    Join Interview
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      form.handleSubmit()
                    }}
                    className="rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    Confirm Interview Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border p-12">
            <div className="text-center">
              <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-400">
                Schedule Interview
              </h3>
              <p className="text-sm text-gray-400">
                Select an applicant to schedule an interview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
