export type InsuranceCompany = {
  id: string
  carrierCode: string
  companyName: string
  tagLine: string
  image: string
  description: string
}

export type CompanyInsurance = {
  companyId: InsuranceCompany['id']
  insurances: Array<string>
}
