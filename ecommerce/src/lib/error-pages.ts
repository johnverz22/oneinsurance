export interface ErrorPageCopy {
  code: number
  label: string
  heading: string
  description: string
}

/**
 * Approved error page copy from the design handoff
 * (developers.oneinsurance.shop/downloads/design/error-<code>).
 * All codes share the same layout; only code/heading/description differ.
 */
export const ERROR_PAGES: Record<number, ErrorPageCopy> = {
  400: {
    code: 400,
    label: 'Bad request',
    heading: 'Something isn’t quite right.',
    description:
      'We couldn’t understand this request. Open the page again from home and check the details you enter.',
  },
  401: {
    code: 401,
    label: 'Authentication required',
    heading: 'Please sign in to continue.',
    description:
      'You need to be signed in to open this page. Return home to find the right place to get started.',
  },
  403: {
    code: 403,
    label: 'Access denied',
    heading: 'This page isn’t available to you.',
    description:
      'You don’t have permission to open this page. Return home, or contact our team if you need help.',
  },
  404: {
    code: 404,
    label: 'Page not found',
    heading: 'Looks like a wrong turn.',
    description:
      'We can’t find the page you’re looking for. It may have moved, or the link may be out of date.',
  },
  405: {
    code: 405,
    label: 'Method not allowed',
    heading: 'Let’s open that another way.',
    description:
      'This action isn’t available from this link. Return home and open the page from there.',
  },
  408: {
    code: 408,
    label: 'Request timeout',
    heading: 'That request took too long.',
    description:
      'The request didn’t finish in time. Check your connection, then open the page again from home.',
  },
  410: {
    code: 410,
    label: 'Page no longer available',
    heading: 'This page has been retired.',
    description:
      'This page is no longer available. You can explore the current options from home.',
  },
  413: {
    code: 413,
    label: 'File too large',
    heading: 'That file is too large.',
    description:
      'We couldn’t accept the uploaded file. Return to the form and choose a smaller file within its stated limit.',
  },
  419: {
    code: 419,
    label: 'Session expired',
    heading: 'Your session has expired.',
    description:
      'This page has been open for a while. Start again from home to continue with a fresh session.',
  },
  422: {
    code: 422,
    label: 'Details need checking',
    heading: 'Let’s check those details.',
    description:
      'Some details couldn’t be accepted. Return to the form and review the highlighted fields before continuing.',
  },
  429: {
    code: 429,
    label: 'Too many requests',
    heading: 'Let’s take a short pause.',
    description:
      'There have been too many requests in a short time. Please wait before trying again.',
  },
  500: {
    code: 500,
    label: 'Server error',
    heading: 'Something went wrong on our side.',
    description:
      'We couldn’t complete this request. Please try again later, or contact our team if you need help.',
  },
  502: {
    code: 502,
    label: 'Bad gateway',
    heading: 'We couldn’t complete the connection.',
    description:
      'A service we rely on returned an unexpected response. Please try again later.',
  },
  503: {
    code: 503,
    label: 'Service unavailable',
    heading: 'We’re temporarily unavailable.',
    description:
      'This service isn’t available right now. Please come back later, or contact our team for help.',
  },
  504: {
    code: 504,
    label: 'Gateway timeout',
    heading: 'We’re still waiting for a response.',
    description:
      'A service we rely on didn’t respond in time. Please try again later, or contact our team for help.',
  },
}

export const ERROR_PAGE_CODES = Object.keys(ERROR_PAGES).map(Number)
