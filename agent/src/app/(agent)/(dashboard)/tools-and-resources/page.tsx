'use client'

import React, { useState } from 'react'
import {
  Calculator,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Mail,
  BookOpen,
  Shield,
  TrendingUp,
  Search,
  Download,
  ExternalLink,
  CheckCircle,
  User,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

const InsuranceToolsDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const calculatorTools = [
    {
      title: 'Life Insurance Calculator',
      description: 'Calculate coverage needs based on income, debts, and goals',
      icon: <DollarSign className="h-5 w-5" />,
      category: 'Life Insurance',
    },
    {
      title: 'Auto Premium Calculator',
      description: 'Estimate auto insurance premiums with various factors',
      icon: <Calculator className="h-5 w-5" />,
      category: 'Auto Insurance',
    },
    {
      title: 'Home Insurance Calculator',
      description: 'Determine appropriate coverage for residential properties',
      icon: <Shield className="h-5 w-5" />,
      category: 'Property Insurance',
    },
    {
      title: 'Retirement Planning Tool',
      description: 'Calculate retirement savings and annuity needs',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'Retirement',
    },
  ]

  const resources = [
    {
      title: 'State Insurance Regulations',
      description: 'Updated regulations and requirements by state',
      icon: <BookOpen className="h-5 w-5" />,
      type: 'Reference',
      lastUpdated: '2 days ago',
    },
    {
      title: 'Claims Processing Forms',
      description: 'Standardized forms for different claim types',
      icon: <FileText className="h-5 w-5" />,
      type: 'Forms',
      lastUpdated: '1 week ago',
    },
    {
      title: 'Product Comparison Sheets',
      description: 'Side-by-side policy comparisons',
      icon: <Users className="h-5 w-5" />,
      type: 'Sales Tools',
      lastUpdated: '3 days ago',
    },
    {
      title: 'Training Materials',
      description: 'Continuing education and certification resources',
      icon: <BookOpen className="h-5 w-5" />,
      type: 'Education',
      lastUpdated: '1 day ago',
    },
  ]

  const clientTools = [
    {
      title: 'Client Portal',
      description: 'Manage client information and policies',
      icon: <User className="h-5 w-5" />,
      status: 'Active',
    },
    {
      title: 'Quote Generator',
      description: 'Generate quick quotes for prospects',
      icon: <FileText className="h-5 w-5" />,
      status: 'Active',
    },
    {
      title: 'Appointment Scheduler',
      description: 'Schedule and manage client meetings',
      icon: <Calendar className="h-5 w-5" />,
      status: 'Active',
    },
    {
      title: 'Email Templates',
      description: 'Pre-written templates for common communications',
      icon: <Mail className="h-5 w-5" />,
      status: 'Active',
    },
  ]

  const recentActivity = [
    { action: 'New regulation update', time: '2 hours ago', type: 'update' },
    { action: 'Client policy renewed', time: '4 hours ago', type: 'success' },
    { action: 'Training module completed', time: '1 day ago', type: 'success' },
    { action: 'Form template updated', time: '2 days ago', type: 'update' },
  ]

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Insurance Agent Tools & Resources
        </h1>
        <p className="mt-1 text-gray-600">
          Everything you need to serve your clients effectively
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Search tools and resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 pl-10"
          />
        </div>
        <Button>
          <Download />
          Export
        </Button>
      </div>

      <div className="flex flex-col">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="calculators" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculators">Calculators</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="client-tools">Client Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="calculators" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {calculatorTools.map((tool, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2">{tool.icon}</div>
                          <div>
                            <CardTitle className="text-lg">
                              {tool.title}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {tool.category}
                            </Badge>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{tool.description}</CardDescription>
                      <Button className="mt-3 w-full" variant="outline">
                        Open Calculator
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-4 space-y-4">
              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <Card
                    key={index}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2">{resource.icon}</div>
                          <div>
                            <h3 className="font-semibold">{resource.title}</h3>
                            <p className="text-sm text-gray-600">
                              {resource.description}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {resource.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Updated {resource.lastUpdated}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="client-tools" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {clientTools.map((tool, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2">{tool.icon}</div>
                          <div>
                            <CardTitle className="text-lg">
                              {tool.title}
                            </CardTitle>
                            <div className="mt-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <Badge
                                variant="outline"
                                className="text-xs text-green-700"
                              >
                                {tool.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{tool.description}</CardDescription>
                      <Button className="mt-3 w-full">Launch Tool</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default InsuranceToolsDashboard
