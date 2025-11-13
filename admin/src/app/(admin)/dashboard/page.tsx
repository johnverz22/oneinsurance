import { Card, CardContent } from '@/components/ui/card'
import { Database } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="from-primary to-lilac space-y-2 rounded-lg bg-gradient-to-r px-2 py-4 text-white md:px-6 md:py-10 lg:px-10">
        <h1 className="text-xl font-bold md:text-2xl lg:text-3xl">
          Welcome to Your Admin Dashboard!
        </h1>
        <p className="text-sm font-light md:text-base">
          Manage your insurance platform efficiently with a quick overview and
          easy access to key actions.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-bold md:text-2xl lg:text-3xl">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="Total Sales"
            amount={8750000000}
            icon={
              <svg
                width="24"
                height="30"
                viewBox="0 0 24 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 24C24 27.3137 18.6274 30 12 30C5.37258 30 0 27.3137 0 24V19.9082C0.723518 20.5293 1.54778 21.0541 2.39648 21.4785C5.0737 22.8171 8.52939 23.5 12 23.5C15.4706 23.5 18.9263 22.8171 21.6035 21.4785C22.4522 21.0541 23.2765 20.5293 24 19.9082V24ZM24 16.8418C23.3839 17.9519 22.2296 18.9291 20.709 19.6895C18.3732 20.8573 15.2402 21.5 12 21.5C8.75975 21.5 5.62677 20.8573 3.29102 19.6895C1.77036 18.9291 0.616062 17.9519 0 16.8418V10.9082C0.723518 11.5293 1.54778 12.0541 2.39648 12.4785C5.0737 13.8171 8.52939 14.5 12 14.5C15.4706 14.5 18.9263 13.8171 21.6035 12.4785C22.4522 12.0541 23.2765 11.5293 24 10.9082V16.8418ZM12 0C18.6274 0 24 2.68629 24 6V7.8418C23.3839 8.95194 22.2296 9.92908 20.709 10.6895C18.3732 11.8573 15.2402 12.5 12 12.5C8.75975 12.5 5.62677 11.8573 3.29102 10.6895C1.77036 9.92908 0.616062 8.95194 0 7.8418V6C0 2.68629 5.37258 0 12 0Z"
                  fill="#37B164"
                />
              </svg>
            }
            iconBgColor="#DCFCE7"
          />
          <OverviewCard
            title="Total Commissions"
            amount={2_625_000_000}
            icon={
              <svg
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 3.16699C26.3802 3.16699 30.0702 3.16684 32.3965 5.41797C32.4592 5.47866 32.5213 5.54081 32.582 5.60352C34.8332 7.92978 34.833 11.6198 34.833 19C34.833 26.3802 34.8332 30.0702 32.582 32.3965C32.5213 32.4592 32.4592 32.5213 32.3965 32.582C30.0702 34.8332 26.3802 34.833 19 34.833C11.6198 34.833 7.92978 34.8332 5.60352 32.582C5.54081 32.5213 5.47866 32.4592 5.41797 32.3965C3.16684 30.0702 3.16699 26.3802 3.16699 19C3.16699 11.6198 3.16684 7.92978 5.41797 5.60352C5.47866 5.54081 5.54081 5.47866 5.60352 5.41797C7.92978 3.16684 11.6198 3.16699 19 3.16699ZM27.749 13.002C27.0598 12.5425 26.1285 12.7288 25.6689 13.418L20.7695 20.7666L19.5293 18.2871C18.6709 16.5703 16.2777 16.4215 15.2129 18.0186L9.83594 26.085C9.37647 26.7742 9.56269 27.7055 10.252 28.165C10.9412 28.624 11.8726 28.4381 12.332 27.749L17.2314 20.3994L18.4717 22.8799C19.3303 24.5962 21.7223 24.7451 22.7871 23.1484L28.165 15.082C28.6244 14.3928 28.4381 13.4615 27.749 13.002Z"
                  fill="#F08548"
                />
              </svg>
            }
            iconBgColor="#FFEDD5"
          />
          <OverviewCard
            title="Pending Payouts"
            amount={320_000_000}
            icon={
              <svg
                width="42"
                height="42"
                viewBox="0 0 42 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M38.5 24.5C38.5 29.4497 38.4996 31.9242 36.9619 33.4619C35.4242 34.9996 32.9497 35 28 35H14C9.05025 35 6.57578 34.9996 5.03809 33.4619C3.5004 31.9242 3.5 29.4497 3.5 24.5V21.25H38.5V24.5ZM12.25 26C11.1454 26 10.25 26.8954 10.25 28C10.25 29.1046 11.1454 30 12.25 30H12.2676C13.3721 30 14.2676 29.1045 14.2676 28C14.2676 26.8955 13.3721 26 12.2676 26H12.25ZM28 8.75C32.9497 8.75 35.4242 8.7504 36.9619 10.2881C38.2768 11.603 38.4656 13.6029 38.4932 17.25H3.50684C3.53443 13.6029 3.72316 11.603 5.03809 10.2881C6.57578 8.7504 9.05025 8.75 14 8.75H28Z"
                  fill="#E24848"
                />
              </svg>
            }
            iconBgColor="#FEE2E2"
          />
          <OverviewCard
            title="Active Agents"
            amount={45}
            icon={
              <svg
                width="42"
                height="42"
                viewBox="0 0 42 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="21" cy="14" r="7" fill="#A24FED" />
                <path
                  d="M10.3497 26.9805C11.3367 24.2847 14.0217 22.75 16.8926 22.75H25.1074C27.9783 22.75 30.6633 24.2847 31.6503 26.9805C32.3775 28.9667 33.0698 31.4546 33.22 34.0005C33.2525 34.5518 32.8023 35 32.25 35H9.75C9.19771 35 8.74746 34.5518 8.78 34.0005C8.93024 31.4546 9.62253 28.9667 10.3497 26.9805Z"
                  fill="#A24FED"
                />
              </svg>
            }
            iconBgColor="#F3E8FF"
            isCurrency={false}
          />
        </div>
      </div>

      <Card className="border-[#B7B7B7]">
        <CardContent className="space-y-6">
          <h2 className="text-xl font-bold md:text-2xl lg:text-3xl">
            Quick Actions
          </h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              icon="📋"
              title="Product Assesment"
              description="Assign products to agents"
            />
            <QuickActionCard
              icon="💰"
              title="Commission Setup"
              description="Configure commission rates"
            />
            <QuickActionCard
              icon="👥"
              title="Team Management"
              description="View agent hierarchies"
            />
            <QuickActionCard
              icon="📊"
              title="Analytics Dashboard"
              description="View detailed reports"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActionCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card className="border-[#B7B7B7]">
      <CardContent className="flex flex-col items-center justify-center">
        <p className="text-6xl">{icon}</p>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

function OverviewCard({
  title,
  amount,
  icon,
  iconBgColor,
  isCurrency = true,
}: {
  title: string
  amount: number
  icon: React.ReactNode
  iconBgColor: string
  isCurrency?: boolean
}) {
  return (
    <Card className="border-[#B7B7B7]">
      <CardContent className="flex flex-wrap items-center gap-2 text-wrap">
        <div
          className={`rounded-full p-4`}
          style={{
            backgroundColor: iconBgColor,
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-base font-bold md:text-lg">
            {isCurrency
              ? `₱ ${amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : amount}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
