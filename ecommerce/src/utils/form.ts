export function fieldHasError(field: any) {
  const isValid = field.state.meta.isTouched && !field.state.meta.isValid
  const errorMessage = field.state.meta.errors[0]?.message

  return isValid && errorMessage && errorMessage.length > 0
}
