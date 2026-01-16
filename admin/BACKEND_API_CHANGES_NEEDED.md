# Backend API Changes Required for Commission Configuration

## Overview
The frontend now supports separate admin commission fields for Agent-based and Referral-based sales. The backend API needs to be updated to support these new fields.

## Current API Structure (from Postman Collection)

### Update Commission Configuration Endpoint
**PUT** `/admin/commission-configurations/{id}`

**Current Request Body:**
```json
{
  "base_commission": "string",
  "agent_commission": "string",
  "agent_overriders_commission": "string",
  "ifrc_admin": "string",                    // Single field - NEEDS UPDATE
  "ifrc_overrider_commission": "string",     // Single field - NEEDS UPDATE
  "ifrc_digitech": "string",
  "digitech_referral": "string",
  "digitech_overriders": "string",
  "status": "string"
}
```

## Required Changes

### 1. Database Schema Changes
Add new columns to the commission_configurations table:

```sql
-- New columns for referral-based admin commissions
ALTER TABLE commission_configurations 
ADD COLUMN referral_admin VARCHAR(255) AFTER ifrc_admin;

ALTER TABLE commission_configurations 
ADD COLUMN referral_admin_overrider VARCHAR(255) AFTER ifrc_overrider_commission;
```

### 2. API Request/Response Schema Updates

**Updated Request Body:**
```json
{
  "base_commission": "string",
  "agent_commission": "string",
  "agent_overriders_commission": "string",
  "ifrc_admin": "string",                    // For Agent-based sales
  "ifrc_overrider_commission": "string",     // For Agent-based sales
  "referral_admin": "string",                // NEW - For Referral-based sales
  "referral_admin_overrider": "string",      // NEW - For Referral-based sales
  "ifrc_digitech": "string",
  "digitech_referral": "string",
  "digitech_overriders": "string",
  "status": "string"
}
```

### 3. Field Mapping

| Frontend Field | Backend Field | Description |
|----------------|---------------|-------------|
| `agent_admin` | `ifrc_admin` | Admin commission for Agent-based sales |
| `agent_admin_overrider` | `ifrc_overrider_commission` | Admin overrider for Agent-based sales |
| `referral_admin` | `referral_admin` | Admin commission for Referral-based sales (NEW) |
| `referral_admin_overrider` | `referral_admin_overrider` | Admin overrider for Referral-based sales (NEW) |

### 4. Validation Rules

The backend should validate:
1. **Agent-based sales**: `agent_commission + ifrc_admin = base_commission`
2. **Referral-based sales**: `digitech_referral + referral_admin = base_commission`

### 5. Affected Endpoints

All these endpoints need to be updated:

1. **GET** `/admin/commission-configurations` - Include new fields in response
2. **GET** `/admin/commission-configurations/{id}` - Include new fields in response
3. **POST** `/admin/commission-configurations` - Accept new fields in request
4. **PUT** `/admin/commission-configurations/{id}` - Accept new fields in request

### 6. Migration Strategy

For existing records:
- Set `referral_admin` = `ifrc_admin` (copy existing value)
- Set `referral_admin_overrider` = `ifrc_overrider_commission` (copy existing value)

This ensures backward compatibility with existing commission configurations.

### 7. Example Updated Request

```json
{
  "base_commission": "30",
  "agent_commission": "15",
  "agent_overriders_commission": "10",
  "ifrc_admin": "15",
  "ifrc_overrider_commission": "10",
  "referral_admin": "25",
  "referral_admin_overrider": "10",
  "ifrc_digitech": "25",
  "digitech_referral": "5",
  "digitech_overriders": "10",
  "status": "active"
}
```

## Frontend Implementation Status

✅ UI updated with separate admin fields for both scenarios
✅ Validation logic implemented
✅ Simulator updated to show separate calculations
✅ Form mapping ready (currently only sends `ifrc_admin` and `ifrc_overrider_commission`)

⏳ Waiting for backend API updates to send `referral_admin` and `referral_admin_overrider`

## Next Steps

1. Backend team implements database schema changes
2. Backend team updates API endpoints to accept/return new fields
3. Backend team updates validation logic
4. Frontend team updates the mapping function to send all four admin fields
5. Test end-to-end flow
