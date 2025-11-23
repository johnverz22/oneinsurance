export type PaymentsSummary = {
  totalEarnings: number
  totalPaid: number
  pending: number
  lastPaymentDate: string
  nextPaymentDate: string
  monthlyAverage: number
}

export type CommissionBreakdown = {
  label: string
  amount: number
}

export type PaymentStatus = 'Paid' | 'Pending'

export type PaymentHistory = {
  id: string
  period: string
  salesCount: number
  status: PaymentStatus

  grossCommission: {
    total: number
    breakdown: CommissionBreakdown[]
  }

  overriderDeduction: {
    total: number
    breakdown: CommissionBreakdown[]
  }

  netPayment: {
    amount: number
    method: string
    date: string
  }

  paymentStatus: {
    dueDate: string
    paidDate?: string
  }
}
