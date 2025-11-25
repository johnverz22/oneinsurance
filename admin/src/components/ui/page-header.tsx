interface PageHeaderProps {
  title: string
  subTitle: string
}

export function PageHeader({ title, subTitle }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-lg font-bold md:text-2xl">{title}</h1>
      <p className="text-sm font-medium">{subTitle}</p>
    </div>
  )
}
