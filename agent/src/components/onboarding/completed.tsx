'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Sparkles,
  Users,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  ArrowRight,
  Download,
  Star,
  MoveUpRight,
} from 'lucide-react'
import { AgentOnboarding } from '@/types/onboarding'
import Link from 'next/link'

interface AgentOnboardingSuccessProps {
  agent: Partial<
    Pick<
      AgentOnboarding,
      | 'firstName'
      | 'lastName'
      | 'designation'
      | 'companyName'
      | 'email'
      | 'dateOfBirth'
    >
  >
}

export function AgentOnboardingSuccess({ agent }: AgentOnboardingSuccessProps) {
  return (
    <div className="w-full max-w-7xl space-y-6">
      <Card className="relative overflow-hidden border-0 bg-white shadow-2xl">
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-32 -translate-y-32 rounded-full bg-gradient-to-bl from-blue-100 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-24 translate-y-24 rounded-full bg-gradient-to-tr from-green-100 to-transparent opacity-50" />

        <CardContent className="relative p-12 text-center">
          <div className="relative mx-auto mb-8 h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-75" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 animate-pulse text-yellow-400" />
          </div>

          <div className="mb-8 space-y-4">
            <h1 className="text-4xl leading-tight font-bold text-gray-900 md:text-5xl">
              Congratulations for joining
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                our team!
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
              Welcome aboard, {agent.firstName}! We're thrilled to have you as
              part of our insurance family. Your journey to making a difference
              in people's lives starts now.
            </p>
          </div>

          <Button className="text-white" size="lg" asChild>
            <Link href="/">
              Go to your dashboard <MoveUpRight />
            </Link>
          </Button>

          <div className="my-8 rounded-2xl bg-gradient-to-r from-blue-50 to-green-50 p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              {/* Agent Details */}
              <div className="flex-1 text-left">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  {agent.firstName} {agent.lastName}
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Designation:</span>
                    <span>{agent.designation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Company Name:</span>
                    <span>{agent.companyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Email:</span>
                    <span>{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Birth Date:</span>
                    <span>
                      {new Date(
                        agent.dateOfBirth || Date.now()
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="mb-8">
            <h3 className="mb-6 text-xl font-semibold text-gray-900">
              What's Next?
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-6 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-blue-500" />
                <h4 className="mb-2 font-semibold text-gray-900">
                  Training Program
                </h4>
                <p className="text-sm text-gray-600">
                  Complete your comprehensive training modules to get up to
                  speed
                </p>
              </div>
              <div className="rounded-xl bg-green-50 p-6 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-green-500" />
                <h4 className="mb-2 font-semibold text-gray-900">
                  Meet Your Team
                </h4>
                <p className="text-sm text-gray-600">
                  Connect with your colleagues and start building relationships
                </p>
              </div>
              <div className="rounded-xl bg-purple-50 p-6 text-center">
                <MapPin className="mx-auto mb-3 h-8 w-8 text-purple-500" />
                <h4 className="mb-2 font-semibold text-gray-900">
                  Explore Territory
                </h4>
                <p className="text-sm text-gray-600">
                  Get familiar with your assigned territory and client base
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold">Ready to Make an Impact?</h3>
          <p className="mx-auto mb-6 max-w-2xl text-blue-100">
            You're now part of a team that's dedicated to protecting what
            matters most to our clients. Together, we'll build stronger
            communities and brighter futures.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>24/7 Support: (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>help@oneinsurance.com</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
