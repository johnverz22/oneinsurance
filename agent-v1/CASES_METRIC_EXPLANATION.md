# Cases Metric - Implementation Documentation

## 📊 What is "Cases"?

**Cases** = Total count of **commission records** per agent (NOT sales/transaction records)

---

## 🔌 Backend Endpoint

**Endpoint**: `api/v1/agents/statistics`  
**Full URL**: `https://dev-one-insurance.intel-soln.com.ph/api/v1/agents/statistics`

### Request:
```http
GET /api/v1/agents/statistics?date_from=2025-01-01&date_to=2026-02-06
Authorization: Bearer {token}
```

### Response:
```json
{
  "success": true,
  "data": {
    "total_sales": 3099.00,
    "number_of_sales": 6,        // ← This is "Cases" (commission records count)
    "gross_commissions": 774.75,
    "net_commissions": 774.75,
    "average_payout": 0,
    "number_of_products": 2
  }
}
```

---

## 💡 Key Understanding

### Backend Logic:
The backend counts **commission records**, not transaction/sales records.

**SQL Example (Backend):**
```sql
SELECT COUNT(*) as number_of_sales
FROM commission_logs  -- ← Commission table, NOT transactions table
WHERE agent_id = :agent_id
  AND created_at BETWEEN :date_from AND :date_to
```

### Why Commission Records?
- Each commission record represents a completed policy with commission earned
- More accurate representation of agent's actual earnings
- Filters out transactions that didn't result in commissions

---

## 🎯 Frontend Implementation

### 1. Query Hook
**File**: `agent/src/app/data/queries/statistics.ts`

```typescript
export const useGetAgentStatistics = (dateFrom?: string, dateTo?: string) => {
  // Calls: GET /api/agent/statistics
  // Returns: AgentStatistics with number_of_sales field
}
```

### 2. API Route
**File**: `agent/src/app/api/agent/statistics/route.ts`

```typescript
const url = `${process.env.BASE_URL}/agents/statistics`
// BASE_URL = https://dev-one-insurance.intel-soln.com.ph/api/v1
// Full URL = https://dev-one-insurance.intel-soln.com.ph/api/v1/agents/statistics
```

### 3. Display Component
**File**: `agent/src/components/agent/profile-overview.tsx`

```typescript
const { data: statistics } = useGetAgentStatistics()

// Display:
<p>{statistics.number_of_sales}</p>  // ← Commission records count
<span>Cases</span>
```

---

## 📅 Date Range

**Default**: January 1 of last year → Today

**Example (Today is Feb 6, 2026):**
- From: `2025-01-01`
- To: `2026-02-06`
- Period: ~13 months

This counts all commission records created within this date range.

---

## 🔍 Data Flow

```
Profile Overview Component
    ↓
useGetAgentStatistics()
    ↓
GET /api/agent/statistics?date_from=2025-01-01&date_to=2026-02-06
    ↓
Next.js API Route: /api/agent/statistics
    ↓
Backend API: /api/v1/agents/statistics
    ↓
Backend counts commission_logs records
    ↓
Returns { number_of_sales: 6 }
    ↓
Display "6 Cases"
```

---

## ✅ Verification

To verify the data is correct:

1. **Check Backend Database:**
   ```sql
   SELECT COUNT(*) 
   FROM commission_logs 
   WHERE agent_id = {agent_id}
     AND created_at BETWEEN '2025-01-01' AND '2026-02-06'
   ```

2. **Check Network Tab:**
   - Look for: `GET /api/agent/statistics?date_from=...&date_to=...`
   - Response should have `number_of_sales` field

3. **Check Backend Logs:**
   - Verify the endpoint is querying `commission_logs` table
   - Not querying `transactions` or `sales` table

---

## 🎯 Summary

| Metric | Source | Description |
|--------|--------|-------------|
| **Cases** | `commission_logs` table | Count of commission records per agent |
| **Total Sales** | Sum of commission amounts | Total revenue from commissions |
| **Gross Commissions** | Sum of gross commission | Total commissions before deductions |
| **Net Commissions** | Sum of net commission | Total commissions after deductions |

**Important**: "Cases" represents commission records, which may differ from total transactions if some transactions don't generate commissions.

---

## 📝 Notes

- The frontend correctly uses `api/v1/agents/statistics` endpoint ✅
- The backend returns commission records count as `number_of_sales` ✅
- The frontend displays this as "Cases" ✅
- Date range filters are applied correctly ✅

**Last Updated**: February 6, 2026  
**Maintained By**: Development Team
