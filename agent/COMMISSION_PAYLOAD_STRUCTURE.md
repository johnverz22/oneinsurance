# Commission Payload Structure

## Backend Expected Payload

Based on the API requirements, the backend expects the following commission structure:

```json
{
  "product_id": 1,
  "net_premium": 1000.00,
  "base_commission": 10.00,
  "agent_commission": 5.00,
  "agent_overrider_commission": 2.00,
  "agent_admin_commission": 1.50,
  "agent_admin_overrider_commission": 1.00,
  "referral_commission": 3.00,
  "referral_overrider_commission": 1.50,
  "referral_admin_commission": 1.00,
  "referral_admin_overrider_commission": 0.50,
  "effectivity_date": "2026-01-16",
  "status": "active"
}
```

## Field Descriptions

- **product_id**: Integer - The ID of the insurance product
- **net_premium**: Decimal - The net premium amount
- **base_commission**: Decimal - Base commission amount
- **agent_commission**: Decimal - Direct agent commission
- **agent_overrider_commission**: Decimal - Agent overrider commission
- **agent_admin_commission**: Decimal - Agent admin commission
- **agent_admin_overrider_commission**: Decimal - Agent admin overrider commission
- **referral_commission**: Decimal - Referral commission (originally named "digitech")
- **referral_overrider_commission**: Decimal - Referral overrider commission
- **referral_admin_commission**: Decimal - Referral admin commission
- **referral_admin_overrider_commission**: Decimal - Referral admin overrider commission
- **effectivity_date**: String (YYYY-MM-DD) - Date when the commission becomes effective
- **status**: String - Status of the commission (default: "active")

## Important Notes

1. **Field Renaming**: The original field "digitech" has been renamed to "referral_commission" to better reflect its purpose.

2. **Data Types**: All commission amounts should be decimal numbers with 2 decimal places.

3. **Date Format**: The effectivity_date must be in YYYY-MM-DD format.

4. **Status**: The status field defaults to "active" if not specified.

## Console Logging

All API calls to the statistics endpoints now include comprehensive console logging to help debug and verify the data structure:

- Request URL and parameters
- Full response data
- Parsed data structure
- Individual field values

Check the browser console when using the application to see the actual data structure being returned from the API.
