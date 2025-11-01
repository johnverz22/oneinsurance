'use client'

import { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { FileBarChart, FilePlus2, Upload, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export const QuickActions: FC = () => {
  const handleNewApplicationButtonClick = () => {
    toast.info('Under Construction')
  }

  const handleAddClientButtonClick = () => {
    toast.info('Under Construction')
  }

  const handleUploadDocumentButtonClick = () => {
    toast.info('Under Construction')
  }

  const handleGenerateReportButtonClick = () => {
    toast.info('Under Construction')
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-4">
        {/* New Application */}
        <button
          className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-[#F8F5EF] p-4 text-center transition-colors"
          onClick={() => handleNewApplicationButtonClick()}
        >
          <div className={`rounded-full bg-[#B4975A] p-3`}>
            <FilePlus2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-medium text-black">
            New Application
          </span>
        </button>

        {/* Add Client */}
        <button
          className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-[#F8F5EF] p-4 text-center transition-colors"
          onClick={() => handleAddClientButtonClick()}
        >
          <div className={`t00 rounded-full bg-[#B4975A] p-3`}>
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-medium text-black">Add Client</span>
        </button>

        {/* Upload Document */}
        <button
          className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-[#F8F5EF] p-4 text-center transition-colors"
          onClick={() => handleUploadDocumentButtonClick()}
        >
          <div className={`rounded-full bg-[#B4975A] p-3`}>
            <Upload className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-medium text-black">
            Upload Document
          </span>
        </button>

        {/* Generate Report */}
        <button
          className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-[#F8F5EF] p-4 text-center transition-colors"
          onClick={() => handleGenerateReportButtonClick()}
        >
          <div className={`rounded-full bg-[#B4975A] p-3`}>
            <FileBarChart className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-medium text-black">
            Generate Report
          </span>
        </button>
      </CardContent>
    </Card>
  )
}
