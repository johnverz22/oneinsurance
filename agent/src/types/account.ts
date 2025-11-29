import { z } from 'zod'
import { createResponseType } from '@/utils/create-response-type'

export const BaseAccountSchema = z.object({
  id: z.number().optional(),
  account_type: z.string(),
  account_id: z.number(),
  account_name: z.string(),
  account_number: z.string(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
  deleted_at: z.union([z.string(), z.date(), z.null()]),
  is_primary: z.boolean(),
})

export const BankDetailSchema = BaseAccountSchema.extend({
  type: z.literal('bank'),
  bank_name: z.string(),
  branch: z.string(),
  swift_code: z.string(),
})

export const EWalletSchema = BaseAccountSchema.extend({
  type: z.literal('ewallet'),
  provider: z.string(),
  email: z.string(),
  phone: z.string(),
})

export const AccountsDataSchema = z.object({
  bank_details: z.array(BankDetailSchema),
  e_wallets: z.array(EWalletSchema),
})

export const AccountResponseSchema =
  createResponseType<AccountsData>(AccountsDataSchema)

export type BaseAccount = z.infer<typeof BaseAccountSchema>
export type BankDetail = z.infer<typeof BankDetailSchema>
export type EWallet = z.infer<typeof EWalletSchema>
export type AccountsData = z.infer<typeof AccountsDataSchema>
export type AccountsResponse = z.infer<typeof AccountResponseSchema>

export type BankDetailsFormValues = Omit<
  BankDetail,
  'account_id' | 'account_type' | 'created_at' | 'updated_at' | 'deleted_at'
>

export type EWalletFormValues = Omit<
  EWallet,
  'account_id' | 'account_type' | 'created_at' | 'updated_at' | 'deleted_at'
>
