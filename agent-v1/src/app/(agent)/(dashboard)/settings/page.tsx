'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('account-setting')

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-8 flex h-auto border-b bg-transparent p-0">
              {[
                'Account Setting',
                'Login & Security',
                'Notifications',
                'Interface',
              ].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase().replace(/ & | /g, '-')}
                  className="data-[state=active]:border-b-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium shadow-none"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="account-setting">
              <form className="space-y-8">
                <div className="flex flex-col gap-8 sm:flex-row">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center">
                    <div className="bg-muted hover:bg-accent flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border border-dashed transition-colors">
                      <Upload className="text-muted-foreground h-5 w-5" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Upload your photo
                    </p>
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input
                          id="fullName"
                          placeholder="Please enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Please enter your email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="Please enter your username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <div className="flex">
                          <Input
                            id="phone"
                            placeholder="Please enter your phone number"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Write your Bio here e.g your hobbies, interests, etc."
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button variant="ghost" type="reset">
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary text-primary-foreground"
                      >
                        Update Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
