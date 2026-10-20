import { NextResponse } from 'next/server'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// GET /api/payment/transaction-id
//
// Mints a cryptographically secure merchant_transaction_id server-side.
//
// Format: 6 uppercase letters + 14 digits  (e.g. KXRMQW20931847506123)
// ~75 bits of entropy — sufficient for a unique per-session reference.
//
// The ID is minted before the payment form is shown so the payor sees their
// reference number in the checkout summary.  The same ID is passed in the
// /submit request body unchanged — it is never regenerated inside /submit.
// ---------------------------------------------------------------------------

function mintTransactionId(): string {
  // 6 uppercase letters
  const letters = Array.from({ length: 6 }, () => {
    const byte = crypto.randomBytes(1)[0]
    return String.fromCharCode(65 + (byte % 26))
  }).join('')

  // 14 decimal digits — use a 6-byte random value (48 bits) formatted to 14 digits
  // by padding with the current timestamp mod 10^8 for the prefix
  const rndBytes = crypto.randomBytes(6)
  const rndNum = rndBytes.readUIntBE(0, 6) // 0 – 281 trillion
  const digits = rndNum.toString().padStart(14, '0').slice(-14)

  return `${letters}${digits}`
}

export async function GET() {
  const merchant_transaction_id = mintTransactionId()
  return NextResponse.json({ merchant_transaction_id })
}
