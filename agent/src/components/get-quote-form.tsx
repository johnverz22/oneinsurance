'use client'

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { provinces } from '@/constants/phil-prov'
import { dialCodes } from '@/constants/dial-code'
import { barangays } from '@/constants/phil-brgy'
import { citiesMunicipalities } from '@/constants/phil-city-mun'

export default function GetQuoteForm() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dialCode: dialCodes[0].dial_code,
      phone: '',
      address: '',
      country: '',
      province: '',
      city: '',
      barangay: '',
      zipCode: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  const [selectedDialCode, setSelectedDialCode] = useState<string>(
    form.state.values.dialCode
  )
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  return (
    <section className="h-fit w-full py-10">
      <div className="flex h-full w-full flex-col gap-3">
        <h3 className="text-primary text-2xl font-bold md:text-3xl">
          Get a Quote
        </h3>
        {/* form */}
        <div className="flex flex-col gap-4">
          <form action="#" method="get">
            {/* first row */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex w-full flex-col">
                <form.Field
                  name="firstName"
                  children={(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="First Name" />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={inputStyle}
                          required
                        />
                      </>
                    )
                  }}
                />
              </div>

              <div className="flex w-full flex-col">
                <form.Field
                  name="lastName"
                  children={(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label={'Last Name'} />
                        <Input
                          name={field.name}
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={inputStyle}
                          required
                        />
                      </>
                    )
                  }}
                />
              </div>
            </div>

            {/* Second row */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
              <div className="flex w-full flex-col md:col-span-2">
                <form.Field
                  name="email"
                  children={(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Email" />
                        <Input
                          type="email"
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={inputStyle}
                          required
                        />
                      </>
                    )
                  }}
                />
              </div>

              <div className="flex w-full flex-col">
                <form.Field
                  name="dialCode"
                  listeners={{
                    onChange: ({ value }) => {
                      form.setFieldValue('dialCode', value)
                      setSelectedDialCode(value)
                    },
                  }}
                  children={(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Dial Code" />
                        <select
                          name={field.name}
                          id={field.name}
                          className={inputStyle}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        >
                          {dialCodes.map((dialCode, index) => (
                            <option
                              value={dialCode.dial_code}
                              key={index}
                              className="w-fit"
                            >
                              {dialCode.name} ({dialCode.dial_code})
                            </option>
                          ))}
                        </select>
                      </>
                    )
                  }}
                />
              </div>

              <div className="flex w-full flex-col">
                <form.Field name="phone">
                  {(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Phone" />
                        <div className="flex w-full items-center justify-center overflow-hidden rounded-sm border-[1px] border-black">
                          <span className="bg-primary p-2 text-white">
                            {selectedDialCode}
                          </span>
                          <Input
                            type="tel"
                            name={field.name}
                            id={field.name}
                            className={`h-full w-full pl-4`}
                            required
                          />
                        </div>
                      </>
                    )
                  }}
                </form.Field>
              </div>
            </div>

            {/* third row */}
            <div className="grid w-full grid-cols-1">
              <div className="flex w-full flex-col">
                <form.Field name="address">
                  {(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Address" />
                        <Input
                          type="text"
                          name={field.name}
                          id={field.name}
                          value={field.state.value}
                          className={inputStyle}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        />
                      </>
                    )
                  }}
                </form.Field>
              </div>
            </div>

            {/* fourth row */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              {/* Country */}
              <div className="flex w-full flex-col">
                <form.Field
                  name="country"
                  listeners={{
                    onChange: ({ value }) => {
                      form.setFieldValue('country', value)
                      setSelectedCountry(value)
                    },
                  }}
                >
                  {(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Country" />
                        <select
                          id={field.name}
                          name={field.name}
                          className={inputStyle}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        >
                          <option value="0">Select a country</option>
                          <option value="Philippines">Philippines</option>
                        </select>
                      </>
                    )
                  }}
                </form.Field>
              </div>

              {/* province */}
              <div className="flex w-full flex-col">
                <form.Field name="province">
                  {(field) => {
                    return (
                      <>
                        <FieldLabel
                          htmlFor={field.name}
                          label="State/Province"
                        />
                        {selectedCountry === '0' ||
                        selectedCountry.length === 0 ? (
                          <Input
                            type="text"
                            disabled
                            className={inputStyle}
                            placeholder="Select a State/Province"
                          />
                        ) : (
                          <select
                            name={field.name}
                            id={field.name}
                            onChange={(e) => {
                              const val = e.target.value.split('|')
                              field.handleChange(val[0])
                              setSelectedProvince(val[1])
                              console.log('prov_code', val[1])
                            }}
                            className={inputStyle}
                            required
                          >
                            {provinces.map((province, index) => (
                              <option
                                key={index}
                                value={`${province.province}|${province.code}`}
                              >
                                {province.province}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )
                  }}
                </form.Field>
              </div>

              {/* city */}
              <div className="flex w-full flex-col">
                <form.Field name="city">
                  {(field) => {
                    return (
                      <>
                        <FieldLabel
                          htmlFor={field.name}
                          label="City/Municipality"
                        />
                        {selectedCountry === '0' ||
                        selectedCountry.length === 0 ? (
                          <Input
                            type="text"
                            disabled
                            className={inputStyle}
                            placeholder="Select a City/Municipality"
                          />
                        ) : (
                          <select
                            name={field.name}
                            id={field.name}
                            onChange={(e) => {
                              const val = e.target.value.split('|')
                              field.handleChange(val[0])
                              setSelectedCity(val[1])
                            }}
                            className={inputStyle}
                            required
                          >
                            {citiesMunicipalities
                              .filter((e) => e.cityCode == selectedProvince)
                              .map((city, index) => (
                                <option
                                  key={index}
                                  value={`${city.city}|${city.cityCode}`}
                                >
                                  {city.city}
                                </option>
                              ))}
                          </select>
                        )}
                      </>
                    )
                  }}
                </form.Field>
              </div>
            </div>

            {/* fourth row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* barangay */}
              <div className="flex w-full flex-col">
                <form.Field
                  name="barangay"
                  listeners={{
                    onChange: ({ value }) => {
                      form.setFieldValue('barangay', value)
                    },
                  }}
                >
                  {(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Barangay" />
                        {selectedCountry === '0' ||
                        selectedCountry.length === 0 ? (
                          <Input
                            type="text"
                            disabled
                            className={inputStyle}
                            placeholder="Select a Barangay"
                          />
                        ) : (
                          <select
                            name={field.name}
                            id={field.name}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={inputStyle}
                            required
                          >
                            {barangays
                              .filter((e) => e.mun_code == selectedCity)
                              .map((brgy, index) => (
                                <option key={index} value={brgy.name}>
                                  {brgy.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </>
                    )
                  }}
                </form.Field>
              </div>

              <div className="flex w-full flex-col">
                <form.Field
                  name="zipCode"
                  listeners={{
                    onChange: ({ value }) => {
                      form.setFieldValue('barangay', value)
                    },
                  }}
                >
                  {(field) => {
                    return (
                      <>
                        <FieldLabel htmlFor={field.name} label="Zip Code" />
                        {selectedCountry === '0' ||
                        selectedCountry.length === 0 ? (
                          <Input type="text" disabled className={inputStyle} />
                        ) : (
                          <Input
                            type="text"
                            id={field.name}
                            name={field.name}
                            className={inputStyle}
                            required
                          />
                        )}
                      </>
                    )
                  }}
                </form.Field>
              </div>
            </div>

            <div className="flex w-full items-center justify-end pt-6">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="h-fit text-lg text-white"
                  >
                    {isSubmitting ? '...' : 'Submit'}
                  </Button>
                )}
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

const inputStyle = 'rounded-sm border-[1px] border-grey-200 p-2 text-base'

const Asterisk = () => {
  return <span className="font-bold text-red-800">*</span>
}

const FieldLabel = ({ htmlFor, label }: { htmlFor: string; label: string }) => {
  return (
    <Label htmlFor={htmlFor}>
      {label} <Asterisk />
    </Label>
  )
}
