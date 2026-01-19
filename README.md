# OneInsurance Development Notes

**Developer:** Ahmed Talha  
**Date:** January 19, 2026  
**Project:** OneInsurance E-commerce Platform

---

## Overview

This document outlines the fixes and improvements made to resolve critical issues in the travel insurance quote system and OCR functionality.

---

## Issues Fixed

### 1. Travel Insurance Quote 404 Error

**Problem:**  
- POST request to `/VbiKN9PpML/products/undefined/quote/travel/compare-quote` was returning 404
- URL contained "undefined" indicating missing product ID
- Direct API calls from client-side were causing routing issues

**Root Cause:**
- The `initCompareQuote` function was calling the external API directly using `NEXT_PUBLIC_BASE_URL`
- No API route handler existed for travel insurance (unlike CTPL insurance)
- Environment variable `BASE_URL` was undefined in server-side routes

**Solution:**
1. Created API route handler: `/api/travel-insurance/init-compare/route.ts`
   - Proxies requests to backend using server-side `BASE_URL`
   - Includes fallback to `NEXT_PUBLIC_BASE_URL` for local development
   - Added proper error handling and CORS headers
   - Configured `maxDuration = 120` seconds for longer requests

2. Updated mutation: `ecommerce/src/app/data/mutations/create-quote-request.ts`
   - Changed from direct external API call to using `/api/travel-insurance/init-compare`
   - Added response validation
   - Improved error logging

**Files Modified:**
- `ecommerce/src/app/api/travel-insurance/init-compare/route.ts` (created)
- `ecommerce/src/app/data/mutations/create-quote-request.ts`

---

### 2. "Server is taking too long to respond" Error

**Problem:**
- Even though API returned 200 status, frontend showed timeout error
- Data wasn't appearing automatically after quote creation
- Users had to manually click search to see results

**Root Cause:**
- `get-travel-quote.ts` had `return null` on line 25 blocking the query
- Missing GET endpoint for fetching travel insurance quotes
- WebSocket error handling was too aggressive, showing errors too early

**Solution:**
1. Created GET endpoint: `/api/travel-insurance/get-compare/route.ts`
   - Polls backend for quote results using `ClientRequestId`
   - Similar implementation to CTPL insurance get-compare endpoint
   - Includes polling logic with retries

2. Fixed query: `ecommerce/src/app/data/queries/get-travel-quote.ts`
   - Removed blocking `return null` statement
   - Updated endpoint URL to use new API route handler
   - Fixed query to properly fetch cached plans

3. Improved error handling: `ecommerce/src/components/travel-insurance/coverage-options-form.tsx`
   - Added delay before showing error (5 seconds) to allow WebSocket events
   - Improved error state management
   - Added logging for WebSocket events
   - Better queue processing error handling

**Files Modified:**
- `ecommerce/src/app/api/travel-insurance/get-compare/route.ts` (created)
- `ecommerce/src/app/data/queries/get-travel-quote.ts`
- `ecommerce/src/components/travel-insurance/coverage-options-form.tsx`

---

### 3. Network Error for Quote Compare (Cache Key)

**Problem:**
- AxiosError: Network Error when fetching quote compare data
- Frontend was calling external API directly: `${process.env.NEXT_PUBLIC_BASE_URL}/quote/compare/${cacheKey}`
- CORS and network issues from client-side API calls

**Root Cause:**
- Direct external API calls from client-side components
- No API route handler for quote compare endpoint

**Solution:**
1. Created API route handler: `/api/travel-insurance/compare/[cacheKey]/route.ts`
   - Dynamic route handler for cache key-based quote fetching
   - Proxies requests server-side to avoid CORS issues
   - Proper error handling and timeout configuration

2. Updated component: `ecommerce/src/components/travel-insurance/coverage-options-form.tsx`
   - Changed from direct external API call to `/api/travel-insurance/compare/${cacheKey}`
   - Added timeout configuration
   - Improved error handling in queue processing

**Files Modified:**
- `ecommerce/src/app/api/travel-insurance/compare/[cacheKey]/route.ts` (created)
- `ecommerce/src/components/travel-insurance/coverage-options-form.tsx`

---

### 4. Groq OCR API Key Error

**Problem:**
- 401 Error: "Invalid API Key" when uploading ID for OCR extraction
- `GROQ_API_KEY` environment variable not being read properly

**Root Cause:**
- Missing or invalid `GROQ_API_KEY` in environment variables
- No validation or clear error messages
- API key initialization happening at module level before validation

**Solution:**
1. Improved validation: `ecommerce/src/utils/groq-ocr.ts`
   - Added API key validation before making requests
   - Created `getGroqClient()` function to initialize client with validation
   - Added logging to help debug API key issues
   - Better error messages

2. Enhanced error handling: `ecommerce/src/app/api/ocr/route.ts`
   - More specific error messages for different error types
   - Clear guidance on how to fix configuration issues
   - Proper status codes for different error scenarios

**Files Modified:**
- `ecommerce/src/utils/groq-ocr.ts`
- `ecommerce/src/app/api/ocr/route.ts`

---

## Environment Variables Setup

### Required Environment Variables

All environment variables should be in `ecommerce/.env` (not in root directory):

```env
# API Configuration
BASE_URL=https://dev-one-insurance.intel-soln.com.ph/api/v1
NEXT_PUBLIC_BASE_URL=https://dev-one-insurance.intel-soln.com.ph/api/v1
NEXT_PUBLIC_ACCESS_TOKEN=your_access_token_here

# Groq OCR
GROQ_API_KEY=gsk_your_groq_api_key_here

# Payment (if needed)
PAYMENT_BASE_URL=your_payment_api_url
PAYMENT_CLIENT_ID=your_client_id
PAYMENT_CLIENT_SECRET=your_client_secret
MERCHANT_ACCOUNT_ID=your_merchant_id
SECRET_KEY=your_secret_key

# WebSocket/Reverb (if needed)
NEXT_PUBLIC_REVERB_APP_ID=your_app_id
NEXT_PUBLIC_REVERB_APP_KEY=your_app_key
NEXT_PUBLIC_REVERB_APP_SECRET=your_app_secret
NEXT_PUBLIC_REVERB_HOST=your_reverb_host
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=https
```

### Important Notes:
- **Server-side variables** (like `BASE_URL`, `GROQ_API_KEY`) don't need `NEXT_PUBLIC_` prefix
- **Client-side variables** (like `NEXT_PUBLIC_BASE_URL`) need `NEXT_PUBLIC_` prefix
- `.env` file must be in `ecommerce/` directory (where `next.config.ts` is located)
- **Always restart the development server** after adding/changing environment variables
- No spaces around `=` sign: `KEY=value` (not `KEY = value`)

---

## API Route Handlers Created

### 1. `/api/travel-insurance/init-compare` (POST)
- **Purpose:** Initialize travel insurance quote comparison
- **Request Body:** `InitTravelInsuranceRequest`
- **Response:** `InitCompareQuote` with `ClientRequestId`
- **Backend Endpoint:** `POST /quote/travel/compare-quote`

### 2. `/api/travel-insurance/get-compare` (GET)
- **Purpose:** Poll for travel insurance quote results
- **Query Params:** `ClientRequestId`
- **Response:** `TravelInsuranceApiResponse`
- **Backend Endpoint:** `GET /quote/compare?ClientRequestId={id}`
- **Features:** Polling with retries, handles 204 status (not ready)

### 3. `/api/travel-insurance/compare/[cacheKey]` (GET)
- **Purpose:** Fetch quote data by cache key (from WebSocket events)
- **Route Params:** `cacheKey`
- **Response:** `TravelCompareQuoteResponse`
- **Backend Endpoint:** `GET /quote/compare/{cacheKey}`

---

## Architecture Improvements

### Before:
```
Client → Direct External API Call → Backend
❌ CORS issues
❌ Exposed API keys
❌ Network errors
```

### After:
```
Client → Next.js API Route → Backend
✅ No CORS issues
✅ Server-side API keys
✅ Proper error handling
✅ Consistent with CTPL implementation
```

---

## Testing Checklist

- [x] Travel insurance quote creation works
- [x] Quote data appears automatically after creation
- [x] WebSocket events are received and processed
- [x] Quote compare by cache key works
- [x] Error handling shows appropriate messages
- [x] Environment variables are properly loaded
- [ ] Groq OCR works (requires valid API key)

---

### 5. Passport ID Format Validation Fix

**Problem:**  
- Passport format description was too verbose and confusing
- Format description was displayed on the page unnecessarily
- Error message format needed clarification

**Solution:**
1. Updated passport format validation regex (already correct):
   - Pattern: `/^[A-Z][A-Z0-9]\d{6}[A-Z0-9]$/`
   - Format: 1st=Letter, 2nd=Letter/Number, 3rd-8th=6 digits, 9th=Letter/Number
   - Total: 9 characters exactly

2. Improved error messages:
   - Updated error message in `formatValidators.PAS` to be clearer
   - Updated `getIdFormatDescription` function description

3. Removed format description from UI:
   - Removed format description display from `personal-info-form.tsx` (travel insurance)
   - Removed format description display from `personal-info-page.tsx` (CTPL insurance)
   - Format validation still works, but description is no longer shown to users

**Files Modified:**
- `ecommerce/src/types/travel-insurance/travel-insurance-request.ts`
- `ecommerce/src/components/travel-insurance/personal-info-form.tsx`
- `ecommerce/src/components/ctpl-insurance/personal-info-page.tsx`

**Valid Passport Format Examples:**
- `A0123456B` (9 chars: A + 0 + 123456 + B) ✓
- `AB1234567` (9 chars: A + B + 123456 + 7) ✓
- `P0000000A` (9 chars: P + 0 + 000000 + 0 + A) ✓

**Invalid Examples:**
- `P00000000A` (10 chars - too long) ✗
- `A123456` (7 chars - too short) ✗
- `123456789` (starts with number) ✗

---

## Known Issues & Future Improvements

1. **Groq OCR:** Requires valid `GROQ_API_KEY` to be set in `.env`
2. **WebSocket Connection:** May need additional error handling for connection failures
3. **Polling Timeout:** Currently set to 60 retries (60 seconds), may need adjustment
4. **Error Messages:** Could be more user-friendly in production

---

## Developer Notes

- All API routes follow the same pattern as CTPL insurance routes for consistency
- Server-side routes use `BASE_URL`, client-side use `NEXT_PUBLIC_BASE_URL`
- Timeout configurations are set to 120 seconds (2 minutes) for longer operations
- WebSocket implementation uses Echo/Laravel Reverb for real-time updates
- Error handling includes proper logging for debugging

---

## Quick Reference

### Restart Server After Environment Changes
```bash
# Stop server (Ctrl+C)
# Then restart
cd ecommerce
npm run dev
```

### Check Environment Variables
```bash
# In ecommerce directory
cat .env | grep GROQ_API_KEY
cat .env | grep BASE_URL
```

### Verify API Routes
- `POST /api/travel-insurance/init-compare` - Create quote
- `GET /api/travel-insurance/get-compare?ClientRequestId={id}` - Get quote
- `GET /api/travel-insurance/compare/{cacheKey}` - Get quote by cache key

---

**Last Updated:** January 19, 2026  
**Developer:** Ahmed Talha
