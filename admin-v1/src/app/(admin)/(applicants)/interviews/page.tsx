'use client'

import { useGetInterviews } from '@/app/data/queries/interview'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User } from 'lucide-react'
import { format } from 'date-fns'

export default function InterviewsPage() {
  const [page, setPage] = useState(1)
  const { data: interviewsData, isLoading, error } = useGetInterviews(page)

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    if (interviewsData?.data.last_page) {
      setPage((prev) => Math.min(interviewsData.data.last_page, prev + 1))
    }
  }

  const totalPages = interviewsData?.data.last_page || 1
  const currentPage = interviewsData?.data.current_page || 1

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
          Error Loading Interviews
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load interview data. Please try again later.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-muted-foreground mt-4 text-sm">
          Loading interviews...
        </p>
      </div>
    )
  }

  if (!interviewsData?.data.data || interviewsData.data.data.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-400">
          No Scheduled Interviews
        </h3>
        <p className="text-sm text-gray-400">
          There are no interviews scheduled at this time.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">Scheduled Interviews</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            View and manage scheduled agent interviews.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {interviewsData.data.data.map((interview) => {
          const scheduledDate = new Date(interview.scheduled_at)
          const isUpcoming = scheduledDate > new Date()

          return (
            <div
              key={interview.id}
              className="flex flex-col gap-4 rounded-lg border p-6 transition-shadow hover:shadow-md"
            >
              {/* Header with Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="text-base font-bold">
                      {interview.agent.first_name}{' '}
                      {interview.agent.middle_name ?? ''}{' '}
                      {interview.agent.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {interview.agent.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    interview.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : interview.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {interview.status.charAt(0).toUpperCase() +
                    interview.status.slice(1)}
                </span>
              </div>

              {/* Date and Time */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="dark:text-gray-300">
                    {format(scheduledDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="dark:text-gray-300">
                    {format(scheduledDate, 'hh:mm a')}
                  </span>
                </div>
                {isUpcoming && (
                  <span className="text-blue-600 dark:text-blue-400">
                    Upcoming
                  </span>
                )}
              </div>

              {/* Notes */}
              {interview.notes && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Notes: </span>
                    {interview.notes}
                  </p>
                </div>
              )}

              {/* Interviewer */}
              <div className="border-t pt-3 text-sm text-gray-500 dark:text-gray-400">
                Interviewer:{' '}
                <span className="font-medium dark:text-gray-300">
                  {interview.admin.first_name} {interview.admin.last_name}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
