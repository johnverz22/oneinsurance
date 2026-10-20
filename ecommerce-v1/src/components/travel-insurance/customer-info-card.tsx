import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { PolicyRisk, TravelPolicyData } from '@/types/quote'
import {
  getCityNameByCityCode,
  getProvinceNameByProvCode,
} from '@/utils/address-util'

type PolicyRiskList = PolicyRisk[]

type CustomerInfoCardProps = {
  customers: PolicyRiskList
}

export function CustomerInfoCard({ customers }: CustomerInfoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRoleBadges = (customer: PolicyRiskList[number]) => {
    const roles = []
    if (customer.IsMainInsured === 'Y') {
      roles.push('Main Insured')
    } else {
      // FIXED: Additional insured should be labeled as "Additional Insured", not "Beneficiary"
      roles.push('Additional Insured')
    }
    if (customer.IsAdultTraveller === 'Y') {
      roles.push('Adult')
    } else {
      roles.push('Child')
    }
    return roles
  }

  return (
    <Card className="w-full gap-2 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold">
          <User className="text-primary h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {customers.map((customer) => (
            <div
              key={customer.PolicyElementId}
              className="bg-muted/50 border-muted-foreground/20 gap-4 rounded-lg border p-4 px-6"
            >
              <div className="pb-2">
                <h3 className="text-lg font-semibold">
                  {customer.FirstName} {customer.MiddleName} {customer.LastName}
                </h3>
                <div>
                  <Badge variant="outline" className="text-sm font-bold">
                    {customer.IdNo} ({customer.IdTypeCode})
                  </Badge>
                </div>
                <div className="mt-2 flex gap-2">
                  {getRoleBadges(customer).map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p>
                      <span className="font-medium">Gender:</span>{' '}
                      {customer.Gender}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span>{customer.Email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <span>{customer.Mobile}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <div className="text-sm">
                      <p>{customer.AddressLine1}</p>
                      {customer.AddressLine2 && <p>{customer.AddressLine2}</p>}
                      <p>
                        {getCityNameByCityCode(customer.City)},{' '}
                        {getProvinceNameByProvCode(customer.AddrProvince)}{' '}
                        {customer.PostCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span>Born: {formatDate(customer.DateOfBirth)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
