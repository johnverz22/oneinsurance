'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Building,
  Loader2,
  FileText,
  CreditCard,
  Dot
} from 'lucide-react'
import { useGetAgentById } from '@/app/data/queries/agents'
import { AgentBankDetail, AgentEWallet } from '@/app/data/queries/agent-accounts'
// import { useAgentStatistics } from '@/app/data/queries/statistics' // Not used - backend doesn't support agent-specific stats
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AgentProfilePageProps {
  params: Promise<{
    agentId: string
  }>
}

export default function AgentProfilePage({ params }: AgentProfilePageProps) {
  const router = useRouter()
  const [agentId, setAgentId] = React.useState<number | null>(null)

  React.useEffect(() => {
    params.then(({ agentId: agentIdStr }) => {
      setAgentId(parseInt(agentIdStr))
    })
  }, [params])

  const {
    data: agentData,
    isLoading: isLoadingAgent,
    error: agentError,
  } = useGetAgentById(agentId)

  // No need for separate API calls - the agent data already includes everything!
  // agentData.data should contain: bank_details, ewallets, files
  const agent = agentData?.data
  const accountsData = agent ? {
    success: true,
    message: 'Agent data loaded',
    data: {
      bank_details: agent.bank_details || [],
      e_wallets: agent.ewallets || []
    },
    hasAccounts: (agent.bank_details?.length > 0) || (agent.ewallets?.length > 0)
  } : null
  
  const documentsData = agent ? {
    success: true,
    message: 'Agent files loaded',
    data: agent.files || []
  } : null

  const isLoadingAccounts = isLoadingAgent
  const isLoadingDocuments = isLoadingAgent
  const accountsError = agentError
  const documentsError = agentError

  // Note: Agent-specific statistics are not supported by the backend
  // const {
  //   data: statistics,
  //   isLoading: isLoadingStats,
  // } = useAgentStatistics(undefined, undefined, agentId || undefined)
  
  const statistics = null
  const isLoadingStats = false

  const handleBackClick = () => {
    router.push('/agents')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (isLoadingAgent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading agent profile...</span>
        </div>
      </div>
    )
  }

  if (agentError || !agent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {agentError instanceof Error ? agentError.message : agentError || 'Agent not found'}
          </p>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Agent Profile</h1>
            <p className="text-muted-foreground">
              View agent information and statistics
            </p>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="flex w-full flex-col gap-5 xl:flex-row xl:items-center xl:justify-between p-6">
          <div className="flex w-full min-w-1/3 items-center gap-5 xl:w-1/3">
            <Avatar className="size-20">
              {agent.profile_photo_url && <AvatarImage src={agent.profile_photo_url} />}
              <AvatarFallback className="text-2xl">
                {getInitials(agent.name || `${agent.first_name} ${agent.last_name}`)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                {agent.name || `${agent.first_name || ''} ${agent.middle_name || ''} ${agent.last_name || ''}`.trim()}
              </h2>
              <div className="flex items-center gap-1.5 text-blue-500">
                <p>Senior Agent</p>
                <Dot />
                <p>Metro Manila</p>
              </div>
              <p className="text-muted-foreground">
                Member since {agent.created_at ? format(new Date(agent.created_at), 'PP') : 'N/A'}
              </p>
              {!statistics && !isLoadingStats && (
                <p className="text-xs text-muted-foreground mt-1">
                  * Individual agent statistics not available - view commission reports for detailed metrics
                </p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="flex w-full flex-col gap-x-5 gap-y-3 lg:flex-row lg:items-center lg:justify-between">
            {isLoadingStats ? (
              [...Array(4)].map((_, index) => (
                <div key={index} className="border-muted-foreground/10 h-20 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right animate-pulse bg-muted" />
              ))
            ) : statistics ? (
              <>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold">
                      PHP 0.00
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Total Sales
                    </span>
                  </div>
                </div>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold text-blue-500">
                      0
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Cases
                    </span>
                  </div>
                </div>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold">
                      PHP 0.00
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Gross Commissions
                    </span>
                  </div>
                </div>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold text-green-600">
                      PHP 0.00
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Net Commissions
                    </span>
                  </div>
                </div>
              </>
            ) : (
              // Fallback when statistics are not available
              <>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold">
                      PHP 0.00
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Total Sales
                    </span>
                  </div>
                </div>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold text-blue-500">
                      0
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Cases
                    </span>
                  </div>
                </div>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold">
                      PHP 0.00
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Gross Commissions
                    </span>
                  </div>
                </div>
                <div>
                  <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                    <p className="text-lg font-bold text-green-600">
                      PHP 0.00
                    </p>
                    <span className="text-muted-foreground capitalize">
                      Net Commissions
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="font-semibold">
                  {agent.name || `${agent.first_name || ''} ${agent.middle_name || ''} ${agent.last_name || ''}`.trim() || 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{agent.email || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{agent.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge 
                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    agent.status === 'active' && 'bg-green-100 text-green-800 hover:bg-green-200',
                    agent.status === 'inactive' && 'bg-red-100 text-red-800 hover:bg-red-200',
                    agent.status === 'pending' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  )}
                >
                  {agent.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agent ID</p>
                <p className="font-semibold">{agent.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">
                    {agent.created_at ? format(new Date(agent.created_at), 'PPP') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push(`/agents/${agent.id}/policies`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Policies
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push(`/generate-report?agent=${agent.id}`)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Commission Reports
            </Button>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Agent Code</p>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {agent.agent_code || agent.code || `AGT${agent.id.toString().padStart(3, '0')}`}
              </p>
            </div>
            
            {agent.referral_code && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Referral Code</p>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {agent.referral_code}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading documents...</span>
              </div>
            </div>
          ) : documentsError ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load documents</p>
              <p className="text-sm">
                {documentsError instanceof Error ? documentsError.message : 'Error loading documents'}
              </p>
            </div>
          ) : documentsData?.data && documentsData.data.length > 0 ? (
            <div className="space-y-4">
              {documentsData.data.map((document: any) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {document.file_type} • {(document.file_size / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {format(new Date(document.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded</p>
              <p className="text-sm">Agent has not uploaded any documents yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading payment details...</span>
              </div>
            </div>
          ) : accountsError ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load payment details</p>
              <p className="text-sm">
                {accountsError instanceof Error ? accountsError.message : 'Error loading payment details'}
              </p>
            </div>
          ) : accountsData?.hasAccounts ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bank Details */}
              {accountsData.data.bank_details.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Bank Accounts</h4>
                  {accountsData.data.bank_details.map((bankDetail: AgentBankDetail) => (
                    <div key={bankDetail.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-lg">{bankDetail.bank_name}</h5>
                        {bankDetail.is_primary && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Account Name</p>
                          <p className="font-medium">{bankDetail.account_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Account Number</p>
                          <p className="font-medium">{bankDetail.account_number}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Branch</p>
                          <p className="font-medium">{bankDetail.branch}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Swift Code</p>
                          <p className="font-medium">{bankDetail.swift_code}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* E-Wallets */}
              {accountsData.data.e_wallets.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">E-Wallets</h4>
                  {accountsData.data.e_wallets.map((ewallet: AgentEWallet) => (
                    <div key={ewallet.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-lg">{ewallet.provider}</h5>
                        {ewallet.is_primary && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Account Name</p>
                          <p className="font-medium">{ewallet.account_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Account Number</p>
                          <p className="font-medium">{ewallet.account_number}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{ewallet.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{ewallet.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment details found</p>
              <p className="text-sm">Agent has not set up any payment accounts yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}