import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Trees, Eye, Building2, Clock, Sparkles } from 'lucide-react'
import { type Animal, type Shelter, useRescueHubStore } from '@/stores/rescue-hub-store'
import { getSpeciesPlaceholder } from '../utils/placeholders'
import { getDaysInShelter } from '../utils/animal-helpers'

interface ReadyModalProps {
  type: 'adoption' | 'release' | null
  open: boolean
  onOpenChange: (open: boolean) => void
  animals: Animal[]
  shelters: Shelter[]
  onSelectAnimal: (animal: Animal) => void
}

export function ReadyModal({
  type,
  open,
  onOpenChange,
  animals,
  shelters,
  onSelectAnimal,
}: ReadyModalProps) {
  const store = useRescueHubStore()
  if (!type) return null

  const isWild = (species: string) =>
    ['bird', 'reptile', 'snake', 'monkey', 'wild'].includes((species || '').toLowerCase())

  const filtered = animals.filter((a) => {
    if (type === 'adoption') {
      return a.status === 'Ready for Adoption' || (a.status === 'Recovered' && !isWild(a.species))
    } else {
      return a.status === 'Ready for Release' || (a.status === 'Recovered' && isWild(a.species))
    }
  })

  const title = type === 'adoption' ? '🏠 Animals Ready for Adoption' : '🌿 Animals Ready for Release'
  const description =
    type === 'adoption'
      ? 'Fully recovered domestic animals cleared by clinic veterinarians for permanent family adoption.'
      : 'Rehabilitated wildlife species cleared for return to their natural wild habitats.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6 border-teal-500/30 shadow-2xl'>
        <DialogHeader className='pb-4 border-b'>
          <DialogTitle className='text-xl font-extrabold flex items-center gap-2 text-foreground'>
            {title} ({filtered.length})
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            {description}
          </DialogDescription>
        </DialogHeader>

        {filtered.length === 0 ? (
          <div className='py-12 text-center space-y-2 bg-muted/20 rounded-xl border border-dashed my-4'>
            <Sparkles className='h-8 w-8 text-muted-foreground mx-auto animate-pulse' />
            <p className='text-sm font-semibold text-foreground'>No animals currently pending this outcome.</p>
            <p className='text-xs text-muted-foreground'>Check back after veterinarians log medical recoveries.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4'>
            {filtered.map((animal) => {
              const rawAnimShelterId = (animal.shelter_id || '').replace(/^sh-/, '')
              const shelter = shelters.find(
                (s) => s.id === animal.shelter_id || s.id.replace(/^sh-/, '') === rawAnimShelterId
              )
              const days = getDaysInShelter(animal.created_at)

              return (
                <div
                  key={animal.id}
                  className='bg-card rounded-xl border border-teal-500/20 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group'
                >
                  <div>
                    <div className='relative h-40 w-full overflow-hidden bg-slate-900'>
                      <img
                        src={animal.photo_url || getSpeciesPlaceholder(animal.species)}
                        alt={animal.name}
                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                      <div className='absolute top-2 left-2'>
                        <Badge className='bg-black/60 backdrop-blur text-white text-[10px] border-white/20 font-mono'>
                          ANM-00{animal.id}
                        </Badge>
                      </div>
                      <div className='absolute bottom-2 left-2 right-2 text-white flex items-center justify-between'>
                        <Badge className={animal.status === 'Recovered' ? 'bg-emerald-600 text-white' : (type === 'adoption' ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white')} variant='secondary'>
                          {animal.status === 'Recovered' ? '🩺 Medically Cleared' : (type === 'adoption' ? '🏠 Ready to Adopt' : '🌿 Ready to Release')}
                        </Badge>
                        <span className='text-[10px] bg-black/60 px-1.5 py-0.5 rounded font-mono'>
                          {days} Days in Shelter
                        </span>
                      </div>
                    </div>

                    <div className='p-3 space-y-2'>
                      <div>
                        <h4 className='font-extrabold text-sm text-foreground'>{animal.name}</h4>
                        <p className='text-xs text-muted-foreground font-medium'>
                          {animal.species} • {animal.breed} ({animal.sex}, {animal.estimated_age})
                        </p>
                      </div>

                      <div className='flex items-center gap-1 text-xs text-muted-foreground border-t pt-2'>
                        <Building2 className='h-3.5 w-3.5 text-teal-500 shrink-0' />
                        <span className='truncate font-medium'>{shelter ? shelter.name : 'Central Refuge'}</span>
                      </div>

                      <p className='text-[11px] text-muted-foreground line-clamp-2 italic bg-muted/30 p-2 rounded border'>
                        "{animal.notes || animal.condition || 'Medically cleared and ready!'}"
                      </p>
                    </div>
                  </div>

                  <div className='p-3 bg-muted/20 border-t'>
                    <Button
                      size='sm'
                      onClick={() => {
                        onOpenChange(false)
                        onSelectAnimal(animal)
                      }}
                      className='w-full text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold'
                    >
                      <Eye className='h-3.5 w-3.5' /> View Profile Details
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter className='border-t pt-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)} className='text-xs'>
            Close View
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
