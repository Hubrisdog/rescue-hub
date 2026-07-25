import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PawPrint,
  Stethoscope,
  Home,
  Trees,
  Heart,
  Sparkles,
  Trophy,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { type Animal } from '@/stores/rescue-hub-store'
import { getSpeciesPlaceholder } from '../utils/placeholders'
import { getDaysInShelter } from '../utils/animal-helpers'

interface AnimalStatsHeaderProps {
  animals: Animal[]
  onSelectAnimal: (animal: Animal) => void
}

export function AnimalStatsHeader({ animals, onSelectAnimal }: AnimalStatsHeaderProps) {
  const totalCount = animals.length
  const underTreatmentCount = animals.filter((a) => a.status === 'Under Treatment').length

  const isWild = (species: string) =>
    ['bird', 'reptile', 'snake', 'monkey', 'wild'].includes((species || '').toLowerCase())

  const readyForAdoptionCount = animals.filter(
    (a) => a.status === 'Ready for Adoption' || (a.status === 'Recovered' && !isWild(a.species))
  ).length

  const readyForReleaseCount = animals.filter(
    (a) => a.status === 'Ready for Release' || (a.status === 'Recovered' && isWild(a.species))
  ).length

  const adoptedCount = animals.filter((a) => a.status === 'Adopted').length
  const releasedCount = animals.filter((a) => a.status === 'Released').length

  // Auto-select single featured Animal of the Week
  const featuredAnimal =
    animals.find((a) => a.status === 'Recovered' || a.status === 'Under Treatment') ||
    animals[0]

  return (
    <div className='space-y-3 mb-4'>
      {/* Sleek, Compact Featured Hero Banner (Single Featured Instance) */}
      {featuredAnimal && (
        <Card className='border border-emerald-500/20 bg-card shadow-sm overflow-hidden'>
          <div className='p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20'>
            <div className='flex items-center gap-3 overflow-hidden'>
              <img
                src={featuredAnimal.photo_url || getSpeciesPlaceholder(featuredAnimal.species)}
                alt={featuredAnimal.name}
                className='h-12 w-12 rounded-lg object-cover border border-emerald-500/30 shrink-0 bg-slate-800'
              />
              <div className='overflow-hidden space-y-0.5'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full'>
                    <Trophy className='h-3 w-3 text-amber-500' /> Animal of the Week
                  </span>
                  <Badge variant='outline' className='text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 py-0'>
                    <CheckCircle2 className='h-2.5 w-2.5 mr-1' /> {featuredAnimal.status}
                  </Badge>
                </div>
                <h3 className='font-bold text-sm text-foreground truncate flex items-center gap-2'>
                  {featuredAnimal.name}
                  <span className='text-xs font-normal text-muted-foreground'>
                    ({featuredAnimal.species} • {featuredAnimal.breed}, {featuredAnimal.sex}, {featuredAnimal.estimated_age})
                  </span>
                </h3>
              </div>
            </div>

            <div className='flex items-center gap-3 shrink-0 self-end sm:self-center text-xs'>
              <span className='text-muted-foreground flex items-center gap-1 font-mono text-[11px]'>
                <Clock className='h-3 w-3 text-emerald-500' /> {getDaysInShelter(featuredAnimal.created_at)} Days
              </span>
              <Button
                size='sm'
                onClick={() => onSelectAnimal(featuredAnimal)}
                className='h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1'
              >
                View Profile <ArrowRight className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 6 Clean Stat Cards (Matching Main Dashboard Aesthetics) */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
        <Card className='border bg-card shadow-sm hover:border-emerald-500/30 transition-all'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                Registered
              </p>
              <p className='text-xl font-bold text-foreground'>{totalCount}</p>
            </div>
            <div className='h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center'>
              <PawPrint className='h-4 w-4' />
            </div>
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm hover:border-emerald-500/30 transition-all'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                Under Care
              </p>
              <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                {underTreatmentCount}
              </p>
            </div>
            <div className='h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
              <Stethoscope className='h-4 w-4' />
            </div>
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm hover:border-blue-500/30 transition-all'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                Adoptable
              </p>
              <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                {readyForAdoptionCount}
              </p>
            </div>
            <div className='h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
              <Home className='h-4 w-4' />
            </div>
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm hover:border-emerald-500/30 transition-all'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                Releasable
              </p>
              <p className='text-xl font-bold text-teal-600 dark:text-teal-400'>
                {readyForReleaseCount}
              </p>
            </div>
            <div className='h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center'>
              <Trees className='h-4 w-4' />
            </div>
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm hover:border-rose-500/30 transition-all'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                Adopted
              </p>
              <p className='text-xl font-bold text-rose-600 dark:text-rose-400'>
                {adoptedCount}
              </p>
            </div>
            <div className='h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center'>
              <Heart className='h-4 w-4 fill-rose-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm hover:border-purple-500/30 transition-all'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                Released
              </p>
              <p className='text-xl font-bold text-purple-600 dark:text-purple-400'>
                {releasedCount}
              </p>
            </div>
            <div className='h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center'>
              <Sparkles className='h-4 w-4' />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
