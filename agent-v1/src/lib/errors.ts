export class NotVerifiedEmailError extends Error {
  public field: string

  constructor(message: string) {
    super(message)
    this.name = 'NotVerifiedEmailError'
    this.field = 'email'

    Object.setPrototypeOf(this, NotVerifiedEmailError.prototype)
  }
}
