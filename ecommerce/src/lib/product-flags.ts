export const PRODUCT_FLAGS: Record<string, boolean> = {
  'travel-insurance': process.env.NEXT_PUBLIC_PRODUCT_TRAVEL !== 'false',
  'motor-insurance': process.env.NEXT_PUBLIC_PRODUCT_MOTOR === 'true',
  'ctpl-insurance': process.env.NEXT_PUBLIC_PRODUCT_MOTOR === 'true',
  'health-insurance': process.env.NEXT_PUBLIC_PRODUCT_HEALTH === 'true',
  'marine-cargo-insurance': process.env.NEXT_PUBLIC_PRODUCT_MARINE === 'true',
  'engineering-insurance': process.env.NEXT_PUBLIC_PRODUCT_ENGINEERING === 'true',
  'specialized-insurance': process.env.NEXT_PUBLIC_PRODUCT_SPECIALIZED === 'true',
}

export type ProductKey = keyof typeof PRODUCT_FLAGS
