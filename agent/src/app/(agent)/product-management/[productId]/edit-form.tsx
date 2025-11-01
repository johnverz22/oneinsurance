'use client'

import { useState } from 'react'
import { delay } from '@/utils/delay'
import { useForm } from '@tanstack/react-form'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { Insurance, insuranceSchema } from '@/types/insurance'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { FieldInfo } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type EditProductFormProps = {
  product: Insurance
}

export const EditProductForm = ({ product }: EditProductFormProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const handleCloseDialog = () => setDialogOpen((prev) => !prev)

  const form = useForm({
    defaultValues: { ...product },
    onSubmit: async ({ value }) => {
      console.log(value)

      // TODO: IMPLEMENT DELETE API
      await delay(3000)
      handleCloseDialog()
    },
    validators: {
      onChange: insuranceSchema,
    },
  })

  return (
    <DialogFormWrapper
      open={dialogOpen}
      setOpen={handleCloseDialog}
      title="Update Product"
      icon={<Pencil className="text-green-400" />}
      contentContainerClassName="overflow-hidden p-8"
    >
      <ScrollArea className="relative h-full max-h-[80vh]">
        <form
          className="space-y-6 pb-24"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="id"
                children={(field) => (
                  <Input
                    type="hidden"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />

              <form.Field
                name="title"
                children={(field) => (
                  <div className="space-y-4">
                    <Label htmlFor={field.name}>Title</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <div className="space-y-4">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value as string)
                      }
                      rows={3}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <form.Field
                name="image"
                children={(field) => (
                  <div className="flex w-full flex-col justify-center gap-2">
                    <h3>Image</h3>
                    <label
                      id={field.name}
                      className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SVG, PNG, JPG or GIF (MAX. 800x400px)
                        </p>
                      </div>
                      <Input
                        type="file"
                        className="hidden"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </label>

                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="categoryId"
                  children={(field) => (
                    <div className="space-y-4">
                      <Label htmlFor={field.name}>Category</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as Insurance['categoryId'])
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="hmo">HMO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field
                  name="companyId"
                  children={(field) => (
                    <div className="space-y-4">
                      <Label htmlFor={field.name}>Company</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as Insurance['companyId'])
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pacific-cross">
                            Pacific Cross
                          </SelectItem>
                          <SelectItem value="malayan-insurance">
                            Malayan Insurance
                          </SelectItem>
                          <SelectItem value="mercantile-insurance">
                            Mercantile Insurance
                          </SelectItem>
                          <SelectItem value="oona-insurance">
                            Oona Insurance
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="more.overview"
                children={(field) => (
                  <div className="space-y-4">
                    <Label htmlFor={field.name}>Overview</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value as string)
                      }
                      rows={3}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <form.Field
                name="more.explanation"
                children={(field) => (
                  <div className="space-y-4">
                    <Label htmlFor={field.name}>Explanation</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value as string)
                      }
                      rows={3}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <form.Field
                name="more.eligibleAge"
                children={(field) => (
                  <div className="space-y-4">
                    <Label htmlFor={field.name}>Eligible Age</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 18-65 years"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h4>Plans</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentPlans = form.getFieldValue('plans')
                form.setFieldValue('plans', [
                  ...currentPlans,
                  {
                    name: '',
                    coverage: [''],
                    benefits: [''],
                    mbl: '',
                    price: 0,
                  },
                ])
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </div>

          <form.Field
            name="plans"
            mode="array"
            children={(field) => (
              <div className="space-y-4">
                {field.state.value.map((_, planIndex) => (
                  <Card key={planIndex} className="relative">
                    <div className="absolute -top-4 right-4 flex items-center justify-center rounded-xl border bg-red-900 p-1">
                      {field.state.value.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newPlans = field.state.value.filter(
                              (_, i) => i !== planIndex
                            )
                            field.handleChange(newPlans)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <form.Field
                          name={`plans[${planIndex}].name`}
                          children={(nameField) => (
                            <div className="space-y-4">
                              <Label>Plan Name</Label>
                              <Input
                                value={nameField.state.value}
                                onChange={(e) =>
                                  nameField.handleChange(e.target.value)
                                }
                                placeholder="Basic Plan"
                              />
                              <FieldInfo field={nameField} />
                            </div>
                          )}
                        />
                        <form.Field
                          name={`plans[${planIndex}].price`}
                          children={(priceField) => (
                            <div className="space-y-4">
                              <Label>Price</Label>
                              <Input
                                type="number"
                                value={priceField.state.value}
                                onChange={(e) =>
                                  priceField.handleChange(
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="0"
                              />
                              <FieldInfo field={priceField} />
                            </div>
                          )}
                        />
                      </div>

                      <form.Field
                        name={`plans[${planIndex}].mbl`}
                        children={(mblField) => (
                          <div className="space-y-4">
                            <Label>Maximum Benefit Limit (MBL)</Label>
                            <Input
                              value={mblField.state.value}
                              onChange={(e) =>
                                mblField.handleChange(e.target.value)
                              }
                              placeholder="$100,000"
                            />
                            <FieldInfo field={mblField} />
                          </div>
                        )}
                      />

                      <form.Field
                        name={`plans[${planIndex}].coverage`}
                        mode="array"
                        children={(coverageField) => (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Coverage</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  coverageField.handleChange([
                                    ...coverageField.state.value,
                                    '',
                                  ])
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Add Coverage
                              </Button>
                            </div>
                            {coverageField.state.value.map(
                              (_, coverageIndex) => (
                                <div key={coverageIndex} className="flex gap-2">
                                  <form.Field
                                    name={`plans[${planIndex}].coverage[${coverageIndex}]`}
                                    children={(itemField) => (
                                      <Input
                                        value={itemField.state.value}
                                        onChange={(e) =>
                                          itemField.handleChange(e.target.value)
                                        }
                                        placeholder="Coverage item"
                                        className="flex-1"
                                      />
                                    )}
                                  />
                                  {coverageField.state.value.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-md border bg-red-900 p-1"
                                      onClick={() => {
                                        const newCoverage =
                                          coverageField.state.value.filter(
                                            (_, i) => i !== coverageIndex
                                          )
                                        coverageField.handleChange(newCoverage)
                                      }}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      />

                      <form.Field
                        name={`plans[${planIndex}].benefits`}
                        mode="array"
                        children={(benefitsField) => (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Benefits</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  benefitsField.handleChange([
                                    ...benefitsField.state.value,
                                    '',
                                  ])
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Add Benifits
                              </Button>
                            </div>
                            {benefitsField.state.value.map(
                              (_, benefitIndex) => (
                                <div key={benefitIndex} className="flex gap-2">
                                  <form.Field
                                    name={`plans[${planIndex}].benefits[${benefitIndex}]`}
                                    children={(itemField) => (
                                      <Input
                                        value={itemField.state.value}
                                        onChange={(e) =>
                                          itemField.handleChange(e.target.value)
                                        }
                                        placeholder="Benefit item"
                                        className="flex-1"
                                      />
                                    )}
                                  />
                                  {benefitsField.state.value.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-md border bg-red-900 p-1"
                                      onClick={() => {
                                        const newBenefits =
                                          benefitsField.state.value.filter(
                                            (_, i) => i !== benefitIndex
                                          )
                                        benefitsField.handleChange(newBenefits)
                                      }}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Important Notes
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentNotes = form.getFieldValue('more.notes')
                    form.setFieldValue('more.notes', [...currentNotes, ''])
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field
                name="more.notes"
                mode="array"
                children={(field) => (
                  <div className="space-y-4">
                    {field.state.value.map((_, noteIndex) => (
                      <div key={noteIndex} className="flex gap-2">
                        <form.Field
                          name={`more.notes[${noteIndex}]`}
                          children={(noteField) => (
                            <Textarea
                              value={noteField.state.value}
                              onChange={(e) =>
                                noteField.handleChange(e.target.value)
                              }
                              placeholder="Important note..."
                              className="flex-1"
                              rows={2}
                            />
                          )}
                        />
                        {field.state.value.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-md border bg-red-900 p-1"
                            onClick={() => {
                              const newNotes = field.state.value.filter(
                                (_, i) => i !== noteIndex
                              )
                              field.handleChange(newNotes)
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h4>Plans</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentFaqs = form.getFieldValue('more.faqs')
                form.setFieldValue('more.faqs', [
                  ...currentFaqs,
                  { question: '', answer: '' },
                ])
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>

          <form.Field
            name="more.faqs"
            mode="array"
            children={(field) => (
              <div className="space-y-4">
                {field.state.value.map((_, faqIndex) => (
                  <Card key={faqIndex} className="relative">
                    <div className="absolute -top-4 right-4 flex items-center justify-center rounded-xl border bg-red-900 p-1">
                      {field.state.value.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFaqs = field.state.value.filter(
                              (_, i) => i !== faqIndex
                            )
                            field.handleChange(newFaqs)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <CardContent className="space-y-4">
                      <form.Field
                        name={`more.faqs[${faqIndex}].question`}
                        children={(questionField) => (
                          <div className="space-y-4">
                            <Label>Question</Label>
                            <Input
                              value={questionField.state.value}
                              onChange={(e) =>
                                questionField.handleChange(e.target.value)
                              }
                              placeholder="What is covered?"
                            />
                            <FieldInfo field={questionField} />
                          </div>
                        )}
                      />
                      <form.Field
                        name={`more.faqs[${faqIndex}].answer`}
                        children={(answerField) => (
                          <div className="space-y-4">
                            <Label>Answer</Label>
                            <Textarea
                              value={answerField.state.value}
                              onChange={(e) =>
                                answerField.handleChange(
                                  e.target.value as string
                                )
                              }
                              placeholder="This plan covers..."
                              rows={3}
                            />
                            <FieldInfo field={answerField} />
                          </div>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          />

          <div className="bg-card fixed inset-x-0 -bottom-2 z-30 flex w-full justify-end gap-3 border-t px-8 py-4">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="text-white"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </Button>
              )}
            />
          </div>
        </form>
      </ScrollArea>
    </DialogFormWrapper>
  )
}
