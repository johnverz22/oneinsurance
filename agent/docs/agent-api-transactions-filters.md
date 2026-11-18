# Sales Transactions API — Required Filter Params

## Endpoint

```
GET /api/v1/agents/transactions
```

Auth: `Authorization: Bearer <token>` (Sanctum)

## Pagination Params (already supported)

| Param      | Type   | Default | Description              |
|------------|--------|---------|--------------------------|
| `page`     | int    | 1       | Page number (1-based)    |
| `per_page` | int    | 10      | Rows per page            |

## Filter Params (need backend implementation)

| Param       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `search`    | string | no       | Free-text search. Should match across: `policy_number`, `certificate_number`, `payment_id`, `merchant_transaction_id`, `proposal_number`, product name, plan name. Case-insensitive. |
| `date_from` | string | no       | ISO date `yyyy-MM-dd`. Filter rows where `created_at` (or `transaction_date`) >= this date. Inclusive. |
| `date_to`   | string | no       | ISO date `yyyy-MM-dd`. Filter rows where `created_at` (or `transaction_date`) <= this date. Inclusive. |

## Example Request

```
GET /api/v1/agents/transactions?page=1&per_page=10&search=POL-123&date_from=2025-01-01&date_to=2025-12-31
```

## Expected Response (standard Laravel pagination)

```json
{
  "success": true,
  "message": "...",
  "data": {
    "data": [
      {
        "id": 1,
        "policy_number": "POL-123",
        "certificate_number": "CERT-456",
        "payment_id": "...",
        "merchant_transaction_id": "...",
        "proposal_number": "...",
        "product": "Auto Insurance",
        "plan_name": "...",
        "amount": 1500.00,
        "premium": 1500.00,
        "net_commission": 150.00,
        "commission_log": null,
        "status": "completed",
        "payment_status": "success",
        "created_at": "2025-06-15T10:30:00.000000Z",
        "transaction_date": "2025-06-15T10:30:00.000000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 10,
      "total": 47
    }
  }
}
```

## Notes

- Filters should be combined with pagination (filter first, then paginate the filtered result).
- `meta.total` and `meta.last_page` must reflect the filtered count, not the unfiltered total.
- If `search` is empty, omit filtering by search (return all rows matching date range if provided).
- If `date_from`/`date_to` is empty, omit date filtering.
- Date comparison should use the `created_at` column (fallback to `transaction_date` if `created_at` is null).
