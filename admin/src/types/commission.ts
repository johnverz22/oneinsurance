/*
{
                "id": 1,
                "product_id": 1,
                "base_commission": "15.50",
                "agent_commission": "8.00",
                "agent_overriders_commission": "2.50",
                "ifrc_admin": "1.00",
                "ifrc_overrider_commission": "1.50",
                "ifrc_digitech": "0.75",
                "digitech_referral": "1.00",
                "digitech_overriders": "0.75",
                "effectivity_date": "2025-01-01T00:00:00.000000Z",
                "status": "active",
                "created_at": "2025-12-12T14:23:50.000000Z",
                "updated_at": "2025-12-12T14:23:50.000000Z",
                "deleted_at": null,
                "product": {
                    "id": 1,
                    "insuremo_reference_id": null,
                    "provider_id": 1,
                    "name": "Family Health Care Plan",
                    "description": "Complete health insurance coverage for the entire family including hospitalization, outpatient, and emergency services",
                    "status": "active",
                    "created_at": "2025-11-27T00:20:44.000000Z",
                    "updated_at": "2025-11-27T00:20:44.000000Z",
                    "deleted_at": null
                }
            }
*/

import { z } from "zod";
import { ProductSchema } from "./products";
import { createPaginatedResponseType } from "@/utils/create-paginated-response-type";

export const CommissionConfigSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  base_commission: z.string(),
  agent_commission: z.string(),
  agent_overriders_commission: z.string(),
  ifrc_admin: z.string(),
  ifrc_overrider_commission: z.string(),
  ifrc_digitech: z.string(),
  digitech_referral: z.string(),
  digitech_overriders: z.string(),
  effectivity_date: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  product: ProductSchema,
});

export type CommissionConfig = z.infer<typeof CommissionConfigSchema>;

export const CommissionConfigPaginatedResponseSchema = createPaginatedResponseType<CommissionConfig>(CommissionConfigSchema);
export type CommissionConfigPaginatedResponse = z.infer<typeof CommissionConfigPaginatedResponseSchema>;