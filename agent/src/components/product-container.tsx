import { ProductCard } from '@/components/product-card'
import { Insurance } from '@/types/insurance'

export interface ProductContainerProps {
  heading: string
  subHeading: string
  items: Array<Insurance>
}

export default function ProductContainer({
  heading,
  subHeading,
  items,
}: ProductContainerProps) {
  return (
    <section className="w-full">
      <div className="flex flex-col gap-4 px-4 py-10 md:px-[10%] lg:px-[20%]">
        <div>
          <h1 className="text-primary text-3xl font-medium sm:text-4xl md:text-5xl">
            {heading}
          </h1>
          <p
            className="text-sm sm:text-lg md:text-lg"
            style={{
              color: 'gray',
            }}
          >
            {subHeading}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 place-content-center gap-8 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item, index) => {
            return (
              <ProductCard
                key={index}
                insurance={item}
                link={`/products/${item.categoryId}/${item.id}`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
