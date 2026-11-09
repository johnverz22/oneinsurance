const _baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
const _isStage = _baseUrl.includes('stage-')
const _shopDomain = _isStage ? 'stage.oneinsurance.shop' : 'oneinsurance.shop'

export const BASE_REFERRAL_URL = `https://${_shopDomain}`
export const BECOME_AN_AGENT_URL = `https://${_shopDomain}/agent-application`
