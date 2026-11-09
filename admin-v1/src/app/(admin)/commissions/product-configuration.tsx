'use client'

import { useUpdateCommissionConfiguration } from '@/app/data/mutations/commission'
import { FieldInfo } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommissionConfig, CommissionConfigUpdateRequest } from '@/types/commission'
import { FieldApi, useForm } from '@tanstack/react-form'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import { getVatOptionFromCheckboxes, getCheckboxesFromVatOption } from '@/utils/vat-options-mapper'

// ─── Design tokens — use CSS variables to match the system exactly ────────────
const C = {
  // Use var(--primary) so it matches the system's exact primary color
  green: 'var(--primary)',
  greenDark: 'color-mix(in oklch, var(--primary) 70%, black)',
  greenLight: 'oklch(from var(--primary) l c h / 0.1)',
  greenBorder: 'oklch(from var(--primary) l c h / 0.3)',
  // Blues (changed to gold)
  blue: '#B8960C',
  blueLight: 'rgba(184, 150, 12, 0.08)',
  blueBorder: 'rgba(184, 150, 12, 0.3)',
  blueMid: '#B8960C',
  // Neutrals — theme-aware via CSS variables
  white: 'hsl(var(--card))',
  bg: 'hsl(var(--muted))',
  border: 'hsl(var(--border))',
  borderLight: 'hsl(var(--border))',
  text: 'hsl(var(--foreground))',
  textMid: 'hsl(var(--foreground))',
  textMuted: 'hsl(var(--muted-foreground))',
  textFaint: 'hsl(var(--muted-foreground))',
  // Destructive
  red: '#DC2626',
  // Purple
  purple: '#7C3AED',
  purpleLight: 'rgba(124, 58, 237, 0.08)',
  purpleBorder: 'rgba(124, 58, 237, 0.3)',
}

const baseInput: React.CSSProperties = {
  padding: '7px 10px',
  fontSize: 13,
  border: `1px solid hsl(var(--input))`,
  borderRadius: 6,
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

// ─── Reusable small components ─────────────────────────────────────────────────

function NumInput({
  value,
  onChange,
  suffix = '%',
  min = 0,
  max = 100,
  step = 1,
  width = 80,
  disabled = false,
}: {
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
  width?: number
  disabled?: boolean
}) {
  // Guard against NaN/undefined/null — always render a valid number
  const safeValue = isNaN(value) || value == null ? 0 : value
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width }}>
      <input
        type="number"
        value={safeValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          ...baseInput,
          width: '100%',
          paddingRight: suffix ? 26 : 10,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'auto',
        }}
      />
      {suffix && (
        <span style={{ position: 'absolute', right: 8, fontSize: 11, color: C.textFaint, pointerEvents: 'none' }}>
          {suffix}
        </span>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function CommCard({
  title,
  scheme,
  rows,
}: {
  title: string
  scheme: 'green' | 'blue' | 'purple'
  rows: { label: string; sub?: string; value: number; onChange: (v: number) => void }[]
}) {
  const bg = scheme === 'green' ? C.greenLight : scheme === 'blue' ? C.blueLight : C.purpleLight
  const border = scheme === 'green' ? C.greenBorder : scheme === 'blue' ? C.blueBorder : C.purpleBorder
  const titleCol = scheme === 'green' ? C.green : scheme === 'blue' ? C.blueMid : C.purple
  return (
    <div style={{ flex: 1, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: bg, padding: '9px 14px', borderBottom: `1px solid ${border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: titleCol, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>
      <div style={{ background: C.white, padding: '4px 14px 10px' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : 'none',
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{row.label}</div>
              {row.sub && <div style={{ fontSize: 11, color: C.textFaint, marginTop: 1 }}>{row.sub}</div>}
            </div>
            <NumInput value={row.value} onChange={row.onChange} width={76} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SimSubBlock({
  title,
  scheme,
  rows,
}: {
  title: string
  scheme: 'green' | 'blue' | 'purple'
  rows: { label: string; value: string }[]
}) {
  const titleCol = scheme === 'green' ? C.green : scheme === 'blue' ? C.blue : C.purple
  return (
    <div style={{ margin: '5px 0', padding: '8px 10px', background: 'rgba(255,255,255,0.65)', borderRadius: 6 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: titleCol, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
        {title}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0 2px 8px' }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>{r.label}</span>
          <span style={{ fontSize: 11, color: C.textMid, fontWeight: 500 }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

function SimRow({
  label,
  tag,
  tagScheme,
  value,
  sign,
  strikethrough,
}: {
  label: string
  tag?: string
  tagScheme?: 'green' | 'blue' | 'purple'
  value: string
  sign?: '+' | '-'
  strikethrough?: boolean
}) {
  const tagBg = tagScheme === 'green' ? C.greenLight : tagScheme === 'blue' ? 'rgba(184, 150, 12, 0.15)' : 'rgba(124, 58, 237, 0.12)'
  const tagCol = tagScheme === 'green' ? C.green : tagScheme === 'blue' ? C.blueMid : C.purple
  const valCol = sign === '+' ? C.green : sign === '-' ? C.red : C.textMid
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 12, color: C.textMid, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
        {tag && (
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: tagBg, color: tagCol, fontWeight: 700 }}>
            {tag}
          </span>
        )}
      </span>
      <span style={{ fontSize: 12, color: valCol, fontWeight: 600, textDecoration: strikethrough ? 'line-through' : 'none' }}>
        {sign === '+' ? '+ ' : sign === '-' ? '- ' : ''}{value}
      </span>
    </div>
  )
}

function SimTotal({ label, value, scheme }: { label: string; value: string; scheme: 'green' | 'blue' }) {
  const bg = scheme === 'green' ? C.greenLight : C.blueLight
  const col = scheme === 'green' ? C.green : C.blueMid
  const border = scheme === 'green' ? C.greenBorder : C.blueBorder
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        padding: '8px 12px',
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>₱{value}</span>
    </div>
  )
}

// ─── Schema & types ───────────────────────────────────────────────────────────

const commisionConfigurationSchema = z.object({
  base_commission: z.number().min(0).max(100),
  agent_commission: z.number().min(0).max(100),
  agent_overrider_commission: z.number().min(0).max(100),
  agent_admin_commission: z.number().min(0).max(100),
  agent_admin_overrider_commission: z.number().min(0).max(100),
  referral_commission: z.number().min(0).max(100),
  referral_overrider_commission: z.number().min(0).max(100),
  referral_admin_commission: z.number().min(0).max(100),
  referral_admin_overrider_commission: z.number().min(0).max(100),
  vat: z.number().min(0).max(100),
  witholding_tax: z.number().min(0).max(100),
  isWithVAT: z.boolean(),
  returnVAT: z.boolean(),
  voidVAT: z.boolean(),
  applyGrossVAT: z.boolean(),
  grossVATRate: z.number().min(0).max(100),
  effectivity_date: z.string().min(1),
})
type FormData = z.infer<typeof commisionConfigurationSchema>

function mapFormDataToUpdateRequest(formData: FormData): CommissionConfigUpdateRequest {
  const vatOptions = getVatOptionFromCheckboxes({
    isWithVAT: formData.isWithVAT,
    returnVAT: formData.returnVAT,
    voidVAT: formData.voidVAT,
    applyGrossVAT: formData.applyGrossVAT,
  })
  return {
    base_commission: formData.base_commission,
    agent_commission: formData.agent_commission,
    agent_overrider_commission: formData.agent_overrider_commission,
    agent_admin_commission: formData.agent_admin_commission,
    agent_admin_overrider_commission: formData.agent_admin_overrider_commission,
    referral_commission: formData.referral_commission,
    referral_overrider_commission: formData.referral_overrider_commission,
    referral_admin_commission: formData.referral_admin_commission,
    referral_admin_overrider_commission: formData.referral_admin_overrider_commission,
    vat: formData.vat,
    witholding_tax: formData.witholding_tax,
    gross_vat: formData.grossVATRate,
    isWithVAT: formData.isWithVAT,
    vatOptions,
    effectivity_date: formData.effectivity_date,
    status: 'active',
  } satisfies CommissionConfigUpdateRequest
}

// ─── VAT mode helpers ─────────────────────────────────────────────────────────

type VatMode = 'deduct' | 'return' | 'void' | 'gross' | 'none'

function getVatMode(values: Pick<FormData, 'isWithVAT' | 'returnVAT' | 'voidVAT' | 'applyGrossVAT'>): VatMode {
  if (values.isWithVAT) return 'deduct'
  if (values.returnVAT) return 'return'
  if (values.voidVAT) return 'void'
  if (values.applyGrossVAT) return 'gross'
  return 'none'
}

function calcNet(
  grossComm: number,
  vatMode: VatMode,
  vatPct: number,
  whtPct: number,
  grossVATRate: number
): { vatAmt: number; whtAmt: number; net: number } {
  const vat = vatPct / 100
  const wht = whtPct / 100
  if (vatMode === 'deduct') {
    const vatAmt = grossComm * vat
    const whtAmt = grossComm * wht
    return { vatAmt, whtAmt, net: grossComm - vatAmt - whtAmt }
  }
  if (vatMode === 'return') {
    const vatAmt = grossComm * vat
    const whtAmt = grossComm * wht
    return { vatAmt, whtAmt, net: grossComm + vatAmt - whtAmt }
  }
  if (vatMode === 'void') {
    const vatAmt = grossComm * vat
    const whtAmt = grossComm * wht
    return { vatAmt, whtAmt, net: grossComm - whtAmt }
  }
  if (vatMode === 'gross' && grossVATRate > 0) {
    // grossVATRate is stored as the factor directly (e.g. 1.12), not as a percentage
    const factor = grossVATRate
    const base = grossComm / factor          // net-of-VAT base
    const vatAmt = base * vat                // VAT = (gross / factor) * vat%
    const whtAmt = (grossComm - vatAmt) * wht // WHT = (gross - VAT) * wht%
    return { vatAmt, whtAmt, net: grossComm - whtAmt }
  }
  // none
  const vatAmt = grossComm * vat
  const whtAmt = grossComm * wht
  return { vatAmt, whtAmt, net: grossComm - whtAmt }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedCommissionConfig: CommissionConfig | null
  onUpdateSuccess?: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'base', label: 'Base & Tax' },
  { id: 'agent', label: 'Agent-based Sales' },
  { id: 'referral', label: 'Referral-based Sales' },
]

export default function ProductCommisionConfiguration({ selectedCommissionConfig, onUpdateSuccess }: Props) {
  const { mutateAsync: updateCommission } = useUpdateCommissionConfiguration()
  const [activeTab, setActiveTab] = useState('base')
  const [saved, setSaved] = useState(false)
  const [grossPremium, setGrossPremium] = useState(1000)

  const form = useForm({
    defaultValues: {
      base_commission: Number(selectedCommissionConfig?.base_commission) || 0,
      agent_commission: Number(selectedCommissionConfig?.agent_commission) || 0,
      agent_overrider_commission: Number(selectedCommissionConfig?.agent_overrider_commission || selectedCommissionConfig?.agent_overriders_commission) || 0,
      agent_admin_commission: Number(selectedCommissionConfig?.agent_admin_commission || selectedCommissionConfig?.ifrc_admin) || 0,
      agent_admin_overrider_commission: Number(selectedCommissionConfig?.agent_admin_overrider_commission || selectedCommissionConfig?.ifrc_overrider_commission) || 0,
      referral_commission: Number(selectedCommissionConfig?.referral_commission || selectedCommissionConfig?.ifrc_digitech) || 0,
      referral_overrider_commission: Number(selectedCommissionConfig?.referral_overrider_commission || selectedCommissionConfig?.digitech_referral) || 0,
      referral_admin_commission: Number(selectedCommissionConfig?.referral_admin_commission || selectedCommissionConfig?.digitech_overriders) || 0,
      referral_admin_overrider_commission: Number(selectedCommissionConfig?.referral_admin_overrider_commission || selectedCommissionConfig?.ifrc_admin) || 0,
      vat: Number(selectedCommissionConfig?.vat) || 0,
      witholding_tax: Number(selectedCommissionConfig?.witholding_tax) || 0,
      ...getCheckboxesFromVatOption(selectedCommissionConfig?.vatOptions),
      grossVATRate: Number(selectedCommissionConfig?.gross_vat) || 0,
      effectivity_date: selectedCommissionConfig?.effectivity_date
        ? selectedCommissionConfig.effectivity_date.split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
    validators: { onChange: commisionConfigurationSchema },
    onSubmit: async ({ value }) => {
      try {
        const response = await updateCommission({
          data: mapFormDataToUpdateRequest(value),
          commissionConfigId: selectedCommissionConfig!.id,
        })
        if (response?.success) {
          toast.success(response.message || 'Commission configuration updated successfully!')
          setSaved(true)
          onUpdateSuccess?.()
        } else {
          toast.error(response?.message || 'Failed to update commission configuration.')
        }
      } catch {
        toast.error('An error occurred while saving the configuration.')
      }
    },
  })

  React.useEffect(() => {
    if (selectedCommissionConfig) {
      form.reset({
        base_commission: Number(selectedCommissionConfig.base_commission) || 0,
        agent_commission: Number(selectedCommissionConfig.agent_commission) || 0,
        agent_overrider_commission: Number(selectedCommissionConfig.agent_overrider_commission || selectedCommissionConfig.agent_overriders_commission) || 0,
        agent_admin_commission: Number(selectedCommissionConfig.agent_admin_commission || selectedCommissionConfig.ifrc_admin) || 0,
        agent_admin_overrider_commission: Number(selectedCommissionConfig.agent_admin_overrider_commission || selectedCommissionConfig.ifrc_overrider_commission) || 0,
        referral_commission: Number(selectedCommissionConfig.referral_commission || selectedCommissionConfig.ifrc_digitech) || 0,
        referral_overrider_commission: Number(selectedCommissionConfig.referral_overrider_commission || selectedCommissionConfig.digitech_referral) || 0,
        referral_admin_commission: Number(selectedCommissionConfig.referral_admin_commission || selectedCommissionConfig.digitech_overriders) || 0,
        referral_admin_overrider_commission: Number(selectedCommissionConfig.referral_admin_overrider_commission || selectedCommissionConfig.ifrc_admin) || 0,
        vat: Number(selectedCommissionConfig.vat) || 0,
        witholding_tax: Number(selectedCommissionConfig.witholding_tax) || 0,
        ...getCheckboxesFromVatOption(selectedCommissionConfig.vatOptions),
        grossVATRate: Number(selectedCommissionConfig.gross_vat) || 0,
        effectivity_date: selectedCommissionConfig.effectivity_date
          ? selectedCommissionConfig.effectivity_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
      setSaved(false)
    }
  }, [selectedCommissionConfig?.id])

  // ── Interdependent field helpers ──────────────────────────────────────────
  const handleAgentCommissionChange = (v: number) => {
    form.setFieldValue('agent_commission', v)
    form.setFieldValue('agent_admin_commission', Math.max(0, form.getFieldValue('base_commission') - v))
    setSaved(false)
  }
  const handleAgentAdminCommissionChange = (v: number) => {
    form.setFieldValue('agent_admin_commission', v)
    form.setFieldValue('agent_commission', Math.max(0, form.getFieldValue('base_commission') - v))
    setSaved(false)
  }
  const handleReferralCommissionChange = (v: number) => {
    form.setFieldValue('referral_commission', v)
    form.setFieldValue('referral_admin_commission', Math.max(0, form.getFieldValue('base_commission') - v))
    setSaved(false)
  }
  const handleReferralAdminCommissionChange = (v: number) => {
    form.setFieldValue('referral_admin_commission', v)
    form.setFieldValue('referral_commission', Math.max(0, form.getFieldValue('base_commission') - v))
    setSaved(false)
  }
  const handleBaseCommissionChange = (v: number) => {
    const agentComm = form.getFieldValue('agent_commission')
    const refComm = form.getFieldValue('referral_commission')
    form.setFieldValue('base_commission', v)
    form.setFieldValue('agent_admin_commission', Math.max(0, v - agentComm))
    form.setFieldValue('referral_admin_commission', Math.max(0, v - refComm))
    setSaved(false)
  }

  const setVatExclusive = (key: 'isWithVAT' | 'returnVAT' | 'voidVAT' | 'applyGrossVAT', val: boolean) => {
    form.setFieldValue('isWithVAT', false)
    form.setFieldValue('returnVAT', false)
    form.setFieldValue('voidVAT', false)
    form.setFieldValue('applyGrossVAT', false)
    form.setFieldValue(key, val)
    setSaved(false)
  }

  if (!selectedCommissionConfig) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.textMuted,
          fontSize: 14,
        }}
      >
        Select a product to configure commissions
      </div>
    )
  }

  return (
    <form
      style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      {/* ── CENTER — tab config ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* product name + tabs */}
        <div style={{ padding: '14px 22px 0', background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{selectedCommissionConfig.product.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2, marginBottom: 10 }}>
            Overall commission percentage for this product
          </div>
          <div style={{ display: 'flex' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: activeTab === t.id ? 600 : 400,
                  color: activeTab === t.id ? C.green : C.textMuted,
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === t.id ? C.green : 'transparent'}`,
                  cursor: 'pointer',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* tab body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          <form.Subscribe>
            {(state) => {
              const v = state.values

              // ── Base & Tax tab ────────────────────────────────────────────
              if (activeTab === 'base') return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Base commission + date */}
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <Field label="Base Commission">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <NumInput value={v.base_commission} onChange={handleBaseCommissionChange} width={90} />
                          <span style={{ fontSize: 12, color: C.textMuted }}>% of total net sale amount</span>
                        </div>
                      </Field>
                      <Field label="Effectivity Date">
                        <input
                          type="date"
                          value={v.effectivity_date}
                          onChange={(e) => { form.setFieldValue('effectivity_date', e.target.value); setSaved(false) }}
                          style={{ ...baseInput, width: 'auto' }}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Tax config */}
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 18px', borderBottom: `1px solid ${C.borderLight}`, background: C.bg }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid }}>Tax Configuration</span>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <Field label="Value-Added Tax (VAT)">
                          <NumInput value={v.vat} onChange={(val) => { form.setFieldValue('vat', val); setSaved(false) }} width={90} />
                        </Field>
                        <Field label="Withholding Tax (WHT)">
                          <NumInput value={v.witholding_tax} onChange={(val) => { form.setFieldValue('witholding_tax', val); setSaved(false) }} width={90} />
                        </Field>
                      </div>

                      {/* VAT mode radios */}
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        {([
                          ['isWithVAT', 'Deduct VAT'],
                          ['returnVAT', 'Return VAT'],
                          ['voidVAT', 'Void'],
                          ['applyGrossVAT', 'Apply gross VAT'],
                        ] as const).map(([key, lbl]) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMid, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="vatMode"
                              checked={v[key]}
                              onChange={() => setVatExclusive(key, true)}
                              style={{ accentColor: C.green }}
                            />
                            {lbl}
                          </label>
                        ))}
                      </div>

                      {v.applyGrossVAT && (
                        <Field label="VAT factor (gross %)">
                          <NumInput
                            value={v.grossVATRate}
                            onChange={(val) => { form.setFieldValue('grossVATRate', val); setSaved(false) }}
                            suffix=""
                            min={0}
                            step={0.01}
                            width={90}
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                </div>
              )

              // ── Agent tab ─────────────────────────────────────────────────
              if (activeTab === 'agent') return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Commission distribution when sale is made by an Agent</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CommCard
                      title="Agent Commission"
                      scheme="blue"
                      rows={[
                        { label: 'Agent', value: v.agent_commission, onChange: handleAgentCommissionChange },
                        { label: 'Overrider', sub: '% of agent commission', value: v.agent_overrider_commission, onChange: (val) => { form.setFieldValue('agent_overrider_commission', val); setSaved(false) } },
                      ]}
                    />
                    <CommCard
                      title="Admin Commission"
                      scheme="purple"
                      rows={[
                        { label: 'Admin', value: v.agent_admin_commission, onChange: handleAgentAdminCommissionChange },
                        { label: 'Overrider', sub: '% of admin commission', value: v.agent_admin_overrider_commission, onChange: (val) => { form.setFieldValue('agent_admin_overrider_commission', val); setSaved(false) } },
                      ]}
                    />
                  </div>
                </div>
              )

              // ── Referral tab ──────────────────────────────────────────────
              if (activeTab === 'referral') return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Commission distribution when sale is made by a Referral</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CommCard
                      title="Referral Commission"
                      scheme="green"
                      rows={[
                        { label: 'Referral', value: v.referral_commission, onChange: handleReferralCommissionChange },
                        { label: 'Overrider', sub: '% of referral commission', value: v.referral_overrider_commission, onChange: (val) => { form.setFieldValue('referral_overrider_commission', val); setSaved(false) } },
                      ]}
                    />
                    <CommCard
                      title="Admin Commission"
                      scheme="purple"
                      rows={[
                        { label: 'Admin', value: v.referral_admin_commission, onChange: handleReferralAdminCommissionChange },
                        { label: 'Overrider', sub: '% of admin commission', value: v.referral_admin_overrider_commission, onChange: (val) => { form.setFieldValue('referral_admin_overrider_commission', val); setSaved(false) } },
                      ]}
                    />
                  </div>
                </div>
              )

              return null
            }}
          </form.Subscribe>

          {/* Save button */}
          <div style={{ marginTop: 24 }}>
            <Button
              type="submit"
              className="from-primary to-lilac rounded-full bg-gradient-to-r text-white"
            >
              {saved ? '✓ Configuration Saved' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── RIGHT — simulator ───────────────────────────────────────────────── */}
      <div
        style={{
          width: 284,
          background: C.white,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.borderLight}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Commission Simulator</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            Preview how commissions will be distributed based on net premium.
          </div>
        </div>

        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500, whiteSpace: 'nowrap' }}>Net Premium:</span>
          <NumInput value={grossPremium} onChange={setGrossPremium} suffix="" min={1} width={90} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <form.Subscribe>
            {(state) => {
              const v = state.values
              const f = (n: number) => Math.abs(n).toFixed(2)
              const vatMode = getVatMode(v)
              const base = v.base_commission
              const bAmt = grossPremium * (base / 100)

              // Agent
              const aC = grossPremium * (v.agent_commission / 100)
              const aO = aC * (v.agent_overrider_commission / 100)
              const aA = grossPremium * (v.agent_admin_commission / 100)
              const aAO = aA * (v.agent_admin_overrider_commission / 100)
              const { vatAmt: aV, whtAmt: aW, net: aN } = calcNet(aC, vatMode, v.vat, v.witholding_tax, v.grossVATRate)

              // Referral
              const rC = grossPremium * (v.referral_commission / 100)
              const rO = rC * (v.referral_overrider_commission / 100)
              const rA = grossPremium * (v.referral_admin_commission / 100)
              const rAO = rA * (v.referral_admin_overrider_commission / 100)
              const { vatAmt: rV, whtAmt: rW, net: rN } = calcNet(rC, vatMode, v.vat, v.witholding_tax, v.grossVATRate)

              const vatLabel = vatMode === 'deduct'
                ? `Deduct VAT (${v.vat}%)`
                : vatMode === 'return'
                ? `Return VAT (${v.vat}%)`
                : vatMode === 'void'
                ? `Void VAT (${v.vat}%)`
                : vatMode === 'gross'
                ? `Gross VAT (${v.grossVATRate}%)`
                : `VAT (${v.vat}%)`

              const vatSign = vatMode === 'return' ? '+' : vatMode === 'deduct' ? '-' : undefined

              return (
                <>
                  {/* Agent block — blue */}
                  <div style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blueMid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingBottom: 7, borderBottom: `1px solid ${C.blueBorder}` }}>
                      Agent-based Distribution
                    </div>
                    <SimRow label="Base Commission Rate" tag={`${base}%`} tagScheme="blue" value={f(bAmt)} />
                    <SimSubBlock scheme="blue" title="Agent Commission" rows={[
                      { label: `Agent (${v.agent_commission}%)`, value: f(aC) },
                      { label: `Overrider (${v.agent_overrider_commission}%)`, value: f(aO) },
                    ]} />
                    <SimSubBlock scheme="purple" title="Admin Commission" rows={[
                      { label: `Admin (${v.agent_admin_commission}%)`, value: f(aA) },
                      { label: `Overrider (${v.agent_admin_overrider_commission}%)`, value: f(aAO) },
                    ]} />
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.blueBorder}` }}>
                      <SimRow
                        label={vatLabel}
                        tagScheme="blue"
                        value={f(aV)}
                        sign={vatSign}
                        strikethrough={vatMode === 'void'}
                      />
                      <SimRow label={`Withholding Tax (${v.witholding_tax}%)`} value={f(aW)} sign="-" />
                    </div>
                    <SimTotal label="Agent Net Commission" value={f(aN)} scheme="blue" />
                  </div>

                  {/* Referral block — green */}
                  <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.greenDark, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingBottom: 7, borderBottom: `1px solid ${C.greenBorder}` }}>
                      Referral-based Distribution
                    </div>
                    <SimRow label="Base Commission Rate" tag={`${base}%`} tagScheme="green" value={f(bAmt)} />
                    <SimSubBlock scheme="green" title="Referral Commission" rows={[
                      { label: `Referral (${v.referral_commission}%)`, value: f(rC) },
                      { label: `Overrider (${v.referral_overrider_commission}%)`, value: f(rO) },
                    ]} />
                    <SimSubBlock scheme="purple" title="Admin Commission" rows={[
                      { label: `Admin (${v.referral_admin_commission}%)`, value: f(rA) },
                      { label: `Overrider (${v.referral_admin_overrider_commission}%)`, value: f(rAO) },
                    ]} />
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.greenBorder}` }}>
                      <SimRow
                        label={vatLabel}
                        tagScheme="green"
                        value={f(rV)}
                        sign={vatSign}
                        strikethrough={vatMode === 'void'}
                      />
                      <SimRow label={`Withholding Tax (${v.witholding_tax}%)`} value={f(rW)} sign="-" />
                    </div>
                    <SimTotal label="Referral Net Commission" value={f(rN)} scheme="green" />
                  </div>
                </>
              )
            }}
          </form.Subscribe>
        </div>
      </div>
    </form>
  )
}
