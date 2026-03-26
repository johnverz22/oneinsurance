'use client'

import { useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

const TESTIMONIALS = [
  {
    rating: 5,
    title: 'Best health coverage I have ever had',
    content:
      'Sobrang gaan ng loob ko nung na-cover ang hospitalization ko ng walang hassle. Ang bilis ng reimbursement at napaka-helpful ng customer support.',
    name: 'Juan Dela Cruz',
    city: 'Cebu',
    avatar: 'https://avatar.iran.liara.run/public/boy/10',
  },
  {
    rating: 5,
    title: 'Reliable and affordable plan',
    content:
      "I've been using One Insurance for my family's health plan for two years now. The coverage is comprehensive and the premiums are very reasonable.",
    name: 'Mark Rivera',
    city: 'Davao',
    avatar: 'https://avatar.iran.liara.run/public/boy/20',
  },
  {
    rating: 5,
    title: 'Peace of mind for my family',
    content:
      'Nung nagkasakit ang aking anak, hindi na kami nag-alala sa gastos dahil covered lahat ng medical expenses. Salamat One Insurance!',
    name: 'Maria Santos',
    city: 'Manila',
    avatar: 'https://avatar.iran.liara.run/public/girl/15',
  },
  {
    rating: 5,
    title: 'Highly recommend to everyone',
    content:
      'The claims process was smooth and fast. I submitted my documents online and received my reimbursement within 3 business days. Excellent service!',
    name: 'Carlo Fernandez',
    city: 'Cebu',
    avatar: 'https://avatar.iran.liara.run/public/boy/30',
  },
  {
    rating: 5,
    title: 'Great value for money',
    content:
      "Compared to other providers, One Insurance gives the best coverage at the most affordable price. I've recommended it to all my colleagues.",
    name: 'Ana Reyes',
    city: 'Quezon City',
    avatar: 'https://avatar.iran.liara.run/public/girl/25',
  },
]

export function HealthTestimonials() {
  const [page, setPage] = useState(0)
  const perPage = 4
  const totalPages = Math.ceil(TESTIMONIALS.length / perPage)
  const visible = TESTIMONIALS.slice(page * perPage, page * perPage + perPage)

  return (
    <section className="w-full bg-[#eef2f7] py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Rounded container matching Figma */}
        <div className="rounded-3xl bg-white p-8 lg:p-12">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent md:text-4xl">
                What Our Customers Say
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Real stories from real Filipino families we've protected
              </p>
            </div>
            <Link
              href="#"
              className="text-foreground flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Read More <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((t, i) => (
              <div key={i} className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm">
                {/* Stars */}
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4" fill="#FBBF24" stroke="#FBBF24" />
                  ))}
                </div>
                {/* Title */}
                <h4 className="mb-2 text-sm font-bold text-gray-900">{t.title}</h4>
                {/* Content */}
                <p className="text-muted-foreground mb-4 flex-1 text-xs leading-relaxed line-clamp-4">
                  "{t.content}"
                </p>
                {/* User */}
                <div className="flex items-center gap-2.5 border-t pt-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={t.avatar} alt={t.name} />
                    <AvatarFallback>{t.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination arrows */}
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
