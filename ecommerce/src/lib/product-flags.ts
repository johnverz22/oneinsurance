export const PRODUCT_FLAGS: Record<string, boolean> = {
  'travel-insurance': process.env.NEXT_PUBLIC_PRODUCT_TRAVEL !== 'false',
  'motor-insurance': process.env.NEXT_PUBLIC_PRODUCT_MOTOR !== 'false',
  'ctpl-insurance': process.env.NEXT_PUBLIC_PRODUCT_MOTOR !== 'false',
  'health-insurance': process.env.NEXT_PUBLIC_PRODUCT_HEALTH !== 'false',
}

export type ProductKey = keyof typeof PRODUCT_FLAGS
