import { Quote, Star, User } from 'lucide-react'

export const TestimonialCard = () => {
  return (
    <div className="border-muted-foreground/20 relative min-h-40 flex-1 rounded-lg border px-3 py-4">
      <div className="flex gap-2 py-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} fill="#46763e" stroke="#46763e" />
        ))}
      </div>

      <Quote className="text-muted-foreground/60 absolute top-[24%] right-8 size-8" />
      <p className="max-w-5/6 pt-2 font-normal">
        Trusted by more than 1 million Filipinos, Oona offers a wide selection
        of general insurance products you can choose from.
      </p>

      <div className="flex items-center gap-2 pt-4">
        <div className="border-muted-foreground/20 w-max rounded-full border p-2">
          <User className="size-6" />
        </div>

        <h6>Mark Lester D.</h6>
      </div>
    </div>
  )
}
