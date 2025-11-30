import { z } from 'zod'
import { createResponseType } from '@/utils/create-response-type'

export const BaseCoreAccountSchema = z.object({
  id: z.number().optional(),
  account_name: z.string().min(1, { message: 'Account name is required' }),
  account_number: z.string().min(1, { message: 'Account number is required' }),
  is_primary: z.boolean(),
})

export const BaseAccountMetaSchema = z.object({
  account_type: z.string(),
  account_id: z.number(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
  deleted_at: z.union([z.string(), z.date(), z.null()]),
})

export const BankDetailSchema = BaseCoreAccountSchema.extend({
  type: z.literal('bank'),
  bank_name: z.string().min(1, { message: 'Bank name is required' }),
  branch: z.string().min(1, { message: 'Branch is required' }),
  swift_code: z.string().min(1, { message: 'Swift code is required' }),
})

export const EWalletSchema = BaseCoreAccountSchema.extend({
  type: z.literal('ewallet'),
  provider: z.string().min(1, { message: 'Provider is required' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .max(11, { message: 'Phone number must not exceed 11 digits' }),
})

export const SavedBankDetailSchema = BankDetailSchema.merge(
  BaseAccountMetaSchema
)

export const SavedEWalletSchema = EWalletSchema.merge(BaseAccountMetaSchema)

export const AccountsDataSchema = z.object({
  bank_details: z.array(SavedBankDetailSchema),
  e_wallets: z.array(SavedEWalletSchema),
})

export const AccountResponseSchema =
  createResponseType<AccountsData>(AccountsDataSchema)

export type BaseNewAccount = z.infer<typeof BaseCoreAccountSchema>

export type BankDetailsFormValues = z.infer<typeof BankDetailSchema>
export type SavedBankDetail = z.infer<typeof SavedBankDetailSchema>

export type EWalletFormValues = z.infer<typeof EWalletSchema>
export type SavedEWallet = z.infer<typeof SavedEWalletSchema>

export type AccountsData = z.infer<typeof AccountsDataSchema>
export type AccountsResponse = z.infer<typeof AccountResponseSchema>
