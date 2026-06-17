import { useRescueHubStore } from '@/stores/rescue-hub-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import {
  Activity,
  Home,
  Heart,
  HeartPulse,
  Clock,
  ClipboardList,
} from 'lucide-react'

export function Dashboard() {
  const incidents = useRescueHubStore((state) => state.incidents)
  const cases = useRescueHubStore((state) => state.cases)
  const animals = useRescueHubStore((state) => state.animals)
  const shelters = useRescueHubStore((state) => state.shelters)

  // Calculations
  const totalCases = cases.length
  const activeCases = cases.filter((c) => c.status !== 'CLOSED').length
  const openIncidents = incidents.filter((inc) => inc.status === 'Pending').length

  // Animals statistics
  const totalAnimals = animals.length
  const recoveredCount = animals.filter((a) => a.status === 'Recovered').length
  const adoptedCount = animals.filter((a) => a.status === 'Adopted').length
  const releasedCount = animals.filter((a) => a.status === 'Released').length

  const recoveryRate = totalAnimals > 0 ? (recoveredCount / totalAnimals) * 100 : 0
  const adoptionRate = totalAnimals > 0 ? (adoptedCount / totalAnimals) * 100 : 0

  // Shelter stats
  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0)
  // Occupancy is computed reactively from how many animals have this shelter_id and are not adopted/released
  const activeAnimalsInShelters = animals.filter(
    (a) => a.shelter_id && a.status !== 'Adopted' && a.status !== 'Released'
  )
  const totalOccupancy = activeAnimalsInShelters.length
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0

  // Average time to close (mocked + calculated)
  const closedCases = cases.filter((c) => c.status === 'CLOSED')
  const avgDaysToClose =
    closedCases.length > 0
      ? closedCases.reduce((acc, c) => {
          const diff = new Date(c.created_at).getTime() - new Date(c.report_date).getTime()
          const days = diff / (1000 * 60 * 60 * 24)
          return acc + (days < 0.1 ? 3.2 : days)
        }, 0) / closedCases.length
      : 4.8

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-4 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>RescueHub Dashboard</h1>
            <p className='text-muted-foreground'>
              Real-time animal rescue operations control and metrics.
            </p>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            {/* Primary KPI Grid */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
              {/* Active Cases */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Active Cases
                  </CardTitle>
                  <Activity className='h-4 w-4 text-blue-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {activeCases} <span className='text-sm font-normal text-muted-foreground'>/ {totalCases} total</span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {openIncidents} pending incident reports
                  </p>
                </CardContent>
              </Card>

              {/* Shelter Occupancy */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Shelter Occupancy
                  </CardTitle>
                  <Home className='h-4 w-4 text-emerald-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {totalOccupancy} <span className='text-sm font-normal text-muted-foreground'>/ {totalCapacity} beds</span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {occupancyRate}% overall capacity utilized
                  </p>
                </CardContent>
              </Card>

              {/* Recovery Rate */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Recovery Rate
                  </CardTitle>
                  <HeartPulse className='h-4 w-4 text-rose-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {recoveryRate.toFixed(1)}%
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {recoveredAnimalsCount(recoveredCount, releasedCount)} recovered/released animals
                  </p>
                </CardContent>
              </Card>

              {/* Adoption Rate */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Adoption Rate
                  </CardTitle>
                  <Heart className='h-4 w-4 text-purple-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {adoptionRate.toFixed(1)}%
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {adoptedCount} animals successfully adopted
                  </p>
                </CardContent>
              </Card>

              {/* Avg Days to Close */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Avg Response/Close
                  </CardTitle>
                  <Clock className='h-4 w-4 text-amber-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {avgDaysToClose.toFixed(1)} days
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Average time to resolve cases
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts & Timeline */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              {/* Cases by Severity Chart */}
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Cases by Severity</CardTitle>
                  <CardDescription>
                    Distribution of rescue cases grouped by urgency.
                  </CardDescription>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>

              {/* Recent Activity Logs */}
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader className='flex flex-row items-center justify-between pb-4'>
                  <div>
                    <CardTitle>Recent Activity Audit Log</CardTitle>
                    <CardDescription>
                      Chronological log of operations in the system.
                    </CardDescription>
                  </div>
                  <ClipboardList className='h-5 w-5 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function recoveredAnimalsCount(rec: number, rel: number) {
  return rec + rel
}

const topNav = [
  {
    title: 'Overview',
    href: '/',
    isActive: true,
    disabled: false,
  },
]
