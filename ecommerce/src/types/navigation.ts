type SingleNavigation = {
  type: 'single'
  label: string
  link: string
}

type MultipleNavigation = {
  type: 'multiple'
  label: string
  items: { title: string; link: string; description?: string }[]
}

export type NavigationItem = SingleNavigation | MultipleNavigation
