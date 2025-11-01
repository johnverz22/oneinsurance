import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MoveRight } from 'lucide-react'

export interface InsuranceBannerProps {
  insuranceName: string
  tagLine: string
  availNowLink: string
}

export default function InsuranceBanner({
  insuranceName,
  tagLine,
  availNowLink,
}: InsuranceBannerProps) {
  return (
    <>
      <section>
        <div className="relative flex h-[50vh] w-full flex-col">
          <div className="absolute h-full w-full">
            <Image
              src={
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtj8FwB7UMmu3dgQnzdMD4ZPWurow1z6IIgw&s'
              }
              fill
              className="object-cover"
              alt=""
            />
          </div>
          <div className="absolute flex h-full w-full flex-col justify-end text-white md:flex-row md:items-center md:justify-start">
            {/* Gradient background */}
            <div className="from-primary flex h-full w-full items-center bg-linear-to-t from-40% md:h-full md:bg-linear-to-r">
              {/* Banner wrapper */}
              <div className="flex h-full w-full flex-col justify-end gap-4 px-4 pb-10 sm:px-10 md:w-[70%] md:justify-center md:px-[10%] lg:px-[20%]">
                <h1 className="text-4xl font-bold">{insuranceName}</h1>
                <p>{tagLine}</p>

                <Button
                  size="lg"
                  variant="outline"
                  className="flex min-w-48 items-center justify-between rounded-md bg-transparent px-4 py-3 text-lg font-semibold text-black backdrop-blur-lg lg:h-12"
                  asChild
                >
                  <Link
                    href={'#avail'}
                    className="h-fit w-fit rounded-full bg-white text-base font-semibold tracking-wide md:text-lg"
                  >
                    <p className="px-4">Avail Now</p>
                    <MoveRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
