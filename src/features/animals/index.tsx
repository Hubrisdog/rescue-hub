import { useState, useMemo } from 'react'
import { useRescueHubStore, type Animal, type AnimalStatusType } from '@/stores/rescue-hub-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Home,
  Trees,
  SlidersHorizontal,
  Stethoscope,
  Heart,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AnimalPhotoUpload } from './components/animal-photo-upload'
import { getSpeciesPlaceholder } from './utils/placeholders'
import { AnimalProfileDialog } from './components/animal-profile-dialog'
import { AnimalStatsHeader } from './components/animal-stats-header'
import { AnimalCardGrid } from './components/animal-card-grid'
import { AnimalSidebarWidgets } from './components/animal-sidebar-widgets'
import { ReadyModal } from './components/ready-modal'
import { getDaysInShelter } from './utils/animal-helpers'

type ViewMode = 'gallery' | 'table'
type SortMode = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'longest_stay' | 'adoptable' | 'critical'

export function Animals() {
  const store = useRescueHubStore()
  const userRole = useAuthStore((state) => state.auth.user?.role?.[0] || 'Rescuer')

  // Search, Filters, View & Sort States
  const [search, setSearch] = useState('')
  const [statusChip, setStatusChip] = useState('All')
  const [speciesFilter, setSpeciesFilter] = useState('All')
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const [sortMode, setSortMode] = useState<SortMode>('newest')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Dialog & Modal States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [readyModalType, setReadyModalType] = useState<'adoption' | 'release' | null>(null)

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)

  // Form States
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('Dog')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState('Unknown')
  const [estimatedAge, setEstimatedAge] = useState('')
  const [weight, setWeight] = useState(0)
  const [color, setColor] = useState('')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<AnimalStatusType>('Intake')
  const [photoUrl, setPhotoUrl] = useState('')
  const [shelterId, setShelterId] = useState('')
  const [caseId, setCaseId] = useState('')

  // Reset pagination when search, chip, or species filter changes
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val)
    setCurrentPage(1)
  }

  // Handlers
  const handleOpenProfile = (a: Animal) => {
    setSelectedAnimal(a)
    setIsProfileOpen(true)
  }

  const handleOpenAdd = () => {
    setName('')
    setSpecies('Dog')
    setBreed('')
    setSex('Unknown')
    setEstimatedAge('')
    setWeight(0)
    setColor('')
    setCondition('Healthy')
    setNotes('')
    setStatus('Intake')
    setPhotoUrl('')
    setShelterId('')
    setCaseId('')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !species) {
      toast.error('Name and Species are required.')
      return
    }

    const finalPhoto = photoUrl.trim() || getSpeciesPlaceholder(species)

    store.addAnimal({
      name,
      species,
      breed: breed || 'Unknown Mix',
      sex,
      estimated_age: estimatedAge || 'Unknown',
      weight: Number(weight) || 0,
      color: color || 'Unknown',
      condition,
      notes,
      status,
      photo_url: finalPhoto,
      shelter_id: shelterId || null,
      case_id: caseId || null,
    })

    setIsAddOpen(false)
    toast.success(`Animal "${name}" registered successfully.`)
  }

  const handleOpenEdit = (a: Animal) => {
    setSelectedAnimal(a)
    setName(a.name)
    setSpecies(a.species)
    setBreed(a.breed)
    setSex(a.sex)
    setEstimatedAge(a.estimated_age)
    setWeight(a.weight)
    setColor(a.color)
    setCondition(a.condition)
    setNotes(a.notes || '')
    setStatus(a.status)
    setPhotoUrl(a.photo_url || '')
    setShelterId(a.shelter_id || '')
    setCaseId(a.case_id || '')
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimal) return

    store.updateAnimal(selectedAnimal.id, {
      name,
      species,
      breed,
      sex,
      estimated_age: estimatedAge,
      weight: Number(weight),
      color,
      condition,
      notes,
      status,
      photo_url: photoUrl || null,
      shelter_id: shelterId || null,
      case_id: caseId || null,
    })

    setIsEditOpen(false)
    toast.success(`Animal profile for "${name}" updated successfully.`)
  }

  const handleOpenDelete = (a: Animal) => {
    setSelectedAnimal(a)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAnimal) return
    const err = await store.deleteAnimal(selectedAnimal.id)
    if (err) {
      toast.error(err)
    } else {
      toast.success(`Animal record for "${selectedAnimal.name}" deleted.`)
    }
    setIsDeleteOpen(false)
  }

  // Enhanced Filtering & Searching
  const filteredAnimals = useMemo(() => {
    return store.animals.filter((a) => {
      const s = search.toLowerCase()
      const rawAnimShelterId = (a.shelter_id || '').replace(/^sh-/, '')
      const shelter = store.shelters.find(
        (sh) => sh.id === a.shelter_id || sh.id.replace(/^sh-/, '') === rawAnimShelterId
      )
      const rawAnimId = (a.id || '').replace(/^ani-/, '')
      const treatment = store.treatments.find(
        (t) => (t.animal_id || '').replace(/^ani-/, '') === rawAnimId || t.animal_id === a.id
      )

      const matchesSearch =
        a.name.toLowerCase().includes(s) ||
        a.species.toLowerCase().includes(s) ||
        a.breed.toLowerCase().includes(s) ||
        a.color.toLowerCase().includes(s) ||
        a.status.toLowerCase().includes(s) ||
        (shelter && shelter.name.toLowerCase().includes(s)) ||
        (treatment && (treatment.diagnosis.toLowerCase().includes(s) || treatment.veterinarian.toLowerCase().includes(s)))

      // Status Chip Filter
      const isWild = ['bird', 'reptile', 'snake', 'monkey', 'wild'].includes((a.species || '').toLowerCase())
      let matchesChip = true

      if (statusChip === 'Under Treatment') {
        matchesChip = a.status === 'Under Treatment'
      } else if (statusChip === 'Ready for Adoption') {
        matchesChip = a.status === 'Ready for Adoption' || (a.status === 'Recovered' && !isWild)
      } else if (statusChip === 'Ready for Release') {
        matchesChip = a.status === 'Ready for Release' || (a.status === 'Recovered' && isWild)
      } else if (statusChip === 'Adopted') {
        matchesChip = a.status === 'Adopted'
      } else if (statusChip === 'Released') {
        matchesChip = a.status === 'Released'
      } else if (statusChip === 'Critical Cases') {
        const c = (a.condition || '').toLowerCase()
        const n = (a.notes || '').toLowerCase()
        matchesChip = c.includes('critical') || c.includes('severe') || n.includes('critical')
      }

      // Species Icon Filter
      let matchesSpecies = true
      if (speciesFilter !== 'All') {
        if (speciesFilter === 'Reptiles') {
          matchesSpecies = ['reptile', 'snake'].includes((a.species || '').toLowerCase())
        } else if (speciesFilter === 'Others') {
          matchesSpecies = !['dog', 'cat', 'bird', 'rabbit', 'horse', 'chicken', 'reptile', 'snake'].includes((a.species || '').toLowerCase())
        } else {
          matchesSpecies = (a.species || '').toLowerCase() === speciesFilter.toLowerCase().replace(/s$/, '')
        }
      }

      return matchesSearch && matchesChip && matchesSpecies
    })
  }, [store.animals, store.shelters, store.treatments, search, statusChip, speciesFilter])

  // Sorting Logic
  const sortedAnimals = useMemo(() => {
    return [...filteredAnimals].sort((a, b) => {
      if (sortMode === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortMode === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortMode === 'name_asc') {
        return a.name.localeCompare(b.name)
      } else if (sortMode === 'name_desc') {
        return b.name.localeCompare(a.name)
      } else if (sortMode === 'longest_stay') {
        return getDaysInShelter(b.created_at) - getDaysInShelter(a.created_at)
      } else if (sortMode === 'adoptable') {
        return a.status === 'Recovered' ? -1 : 1
      } else if (sortMode === 'critical') {
        const aCrit = (a.condition || '').toLowerCase().includes('critical') || a.status === 'Under Treatment'
        const bCrit = (b.condition || '').toLowerCase().includes('critical') || b.status === 'Under Treatment'
        return aCrit ? -1 : bCrit ? 1 : 0
      }
      return 0
    })
  }, [filteredAnimals, sortMode])

  // Pagination Calculation
  const totalItems = sortedAnimals.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAnimals = sortedAnimals.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (st: AnimalStatusType) => {
    switch (st) {
      case 'Intake':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
      case 'Under Treatment':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      case 'Recovered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case 'Ready for Adoption':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'Ready for Release':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
      case 'Adopted':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
      case 'Released':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    }
  }

  // Species List for Icon Quick Filters
  const speciesList = [
    { label: 'All', icon: '🐾', name: 'All' },
    { label: 'Dogs', icon: '🐶', name: 'Dogs' },
    { label: 'Cats', icon: '🐱', name: 'Cats' },
    { label: 'Birds', icon: '🐦', name: 'Birds' },
    { label: 'Rabbits', icon: '🐰', name: 'Rabbits' },
    { label: 'Horses', icon: '🐴', name: 'Horses' },
    { label: 'Chickens', icon: '🐔', name: 'Chickens' },
    { label: 'Reptiles', icon: '🐍', name: 'Reptiles' },
    { label: 'Others', icon: '🐵', name: 'Others' },
  ]

  // Status Chip Options
  const statusChips = [
    { label: 'All', icon: Sparkles },
    { label: 'Under Treatment', icon: Stethoscope },
    { label: 'Ready for Adoption', icon: Home },
    { label: 'Ready for Release', icon: Trees },
    { label: 'Adopted', icon: Heart },
    { label: 'Released', icon: Sparkles },
    { label: 'Critical Cases', icon: AlertTriangle },
  ]

  return (
    <div className='flex-1 space-y-4 p-6 pt-4 max-w-[1600px] mx-auto'>
      {/* Module Title Header & Quick Action Buttons */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b'>
        <div>
          <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
            🐾 Animal Operations Registry
          </h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Central operational hub tracking rescued animals from intake to adoption & wild habitat release.
          </p>
        </div>

        <div className='flex items-center gap-2 flex-wrap w-full sm:w-auto'>
          {/* Quick Action: Ready for Adoption */}
          <Button
            size='sm'
            onClick={() => setReadyModalType('adoption')}
            className='bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm text-xs font-bold'
          >
            <Home className='h-3.5 w-3.5' /> Ready for Adoption
          </Button>

          {/* Quick Action: Ready for Release */}
          <Button
            size='sm'
            onClick={() => setReadyModalType('release')}
            className='bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs font-bold'
          >
            <Trees className='h-3.5 w-3.5' /> Ready for Release
          </Button>

          {(userRole === 'Admin' || userRole === 'Dispatcher') && (
            <Button onClick={handleOpenAdd} size='sm' className='flex gap-1.5 text-xs font-bold'>
              <Plus className='h-4 w-4' /> Add Animal
            </Button>
          )}
        </div>
      </div>

      {/* 1. Dashboard Statistics Header (Single Animal of the Week Banner + 6 Stat Cards) */}
      <AnimalStatsHeader animals={store.animals} onSelectAnimal={handleOpenProfile} />

      {/* 2. Quick Status Filter Chips */}
      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar'>
        <span className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1'>
          Filter:
        </span>
        {statusChips.map((chip) => {
          const Icon = chip.icon
          const isActive = statusChip === chip.label
          return (
            <button
              key={chip.label}
              onClick={() => handleFilterChange(setStatusChip, chip.label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border transition-all shrink-0 text-xs ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <Icon className='h-3 w-3' /> {chip.label}
            </button>
          )
        })}
      </div>

      {/* 3. Species Quick Filter Buttons */}
      <div className='flex items-center gap-2 overflow-x-auto py-1 bg-muted/20 p-2 rounded-xl border no-scrollbar'>
        <span className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 px-2'>
          Species:
        </span>
        {speciesList.map((sp) => {
          const isActive = speciesFilter === sp.name
          return (
            <Button
              key={sp.name}
              variant={isActive ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleFilterChange(setSpeciesFilter, sp.name)}
              className={`h-8 text-xs font-bold gap-1 rounded-lg shrink-0 ${
                isActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <span>{sp.icon}</span> {sp.label}
            </Button>
          )
        })}
      </div>

      {/* Toolbar: Search, Sort & View Mode Toggle */}
      <div className='flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm'>
        {/* Search Bar */}
        <div className='flex items-center gap-2 max-w-md w-full'>
          <Search className='h-4 w-4 text-muted-foreground shrink-0' />
          <Input
            placeholder='Search by animal name, species, shelter, diagnosis, vet, or status...'
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            className='h-9 text-xs'
          />
        </div>

        {/* Sort & View Mode Controls */}
        <div className='flex items-center gap-2 ml-auto'>
          {/* Sort Dropdown */}
          <div className='flex items-center gap-1.5 text-xs'>
            <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
            >
              <option value='newest'>Sort by Newest</option>
              <option value='oldest'>Sort by Oldest</option>
              <option value='name_asc'>Name (A - Z)</option>
              <option value='name_desc'>Name (Z - A)</option>
              <option value='longest_stay'>Longest Shelter Stay</option>
              <option value='adoptable'>Ready for Adoption First</option>
              <option value='critical'>Critical Cases First</option>
            </select>
          </div>

          {/* View Toggle (Gallery vs Table) */}
          <div className='flex items-center bg-muted/40 p-1 rounded-lg border'>
            <Button
              variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('gallery')}
              className='h-7 px-2.5 text-xs gap-1 font-semibold'
            >
              <LayoutGrid className='h-3.5 w-3.5' /> Gallery
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('table')}
              className='h-7 px-2.5 text-xs gap-1 font-semibold'
            >
              <List className='h-3.5 w-3.5' /> Table
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Gallery / Table (9 Cols) + Sticky Widgets Sidebar (3 Cols) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Registry View Area (9 Cols) */}
        <div className='lg:col-span-9 space-y-4'>
          {viewMode === 'gallery' ? (
            <div className='transition-all duration-300 animate-in fade-in-50'>
              <AnimalCardGrid
                animals={paginatedAnimals}
                shelters={store.shelters}
                userRole={userRole}
                onSelectAnimal={handleOpenProfile}
                onEditAnimal={handleOpenEdit}
                onDeleteAnimal={handleOpenDelete}
              />
            </div>
          ) : (
            <div className='rounded-xl border bg-card overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in-50'>
              <Table>
                <TableHeader className='bg-muted/20'>
                  <TableRow>
                    <TableHead className='w-[60px]'>Photo</TableHead>
                    <TableHead>Animal ID & Name</TableHead>
                    <TableHead>Species & Breed</TableHead>
                    <TableHead>Sex & Age</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Shelter</TableHead>
                    <TableHead>Days in Shelter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAnimals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='h-32 text-center text-muted-foreground'>
                        No animal records match your search or filter options.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAnimals.map((a) => {
                      const rawAnimShelterId = (a.shelter_id || '').replace(/^sh-/, '')
                      const shelter = store.shelters.find(
                        (s) => s.id === a.shelter_id || s.id.replace(/^sh-/, '') === rawAnimShelterId
                      )
                      const days = getDaysInShelter(a.created_at)

                      return (
                        <TableRow key={a.id} className='hover:bg-muted/30 transition-colors'>
                          <TableCell>
                            <img
                              src={a.photo_url || getSpeciesPlaceholder(a.species)}
                              alt={a.name}
                              className='h-9 w-9 rounded-lg object-cover border bg-slate-800'
                            />
                          </TableCell>
                          <TableCell>
                            <div className='font-bold text-foreground'>{a.name}</div>
                            <div className='text-[10px] font-mono text-muted-foreground'>ANM-00{a.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className='font-medium text-foreground'>{a.species}</div>
                            <div className='text-xs text-muted-foreground'>{a.breed}</div>
                          </TableCell>
                          <TableCell>
                            <div className='text-xs font-medium'>{a.sex}</div>
                            <div className='text-[11px] text-muted-foreground'>{a.estimated_age}</div>
                          </TableCell>
                          <TableCell className='text-xs font-medium'>{a.weight} kg</TableCell>
                          <TableCell className='text-xs'>
                            {shelter ? shelter.name : <span className='text-muted-foreground italic'>Unassigned</span>}
                          </TableCell>
                          <TableCell>
                            <span className='font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded'>
                              {days} days
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(a.status)} variant='secondary'>
                              {a.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                onClick={() => handleOpenProfile(a)}
                                title='View Profile'
                              >
                                <Eye className='h-3.5 w-3.5' />
                              </Button>
                              {(userRole === 'Admin' || userRole === 'Dispatcher' || userRole === 'Veterinarian') && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 text-muted-foreground'
                                  onClick={() => handleOpenEdit(a)}
                                  title='Edit Record'
                                >
                                  <Edit2 className='h-3.5 w-3.5' />
                                </Button>
                              )}
                              {userRole === 'Admin' && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 text-rose-500 hover:bg-rose-500/10'
                                  onClick={() => handleOpenDelete(a)}
                                  title='Delete Record'
                                >
                                  <Trash2 className='h-3.5 w-3.5' />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls Bar */}
          {totalItems > 0 && (
            <div className='flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm text-xs'>
              <span className='text-muted-foreground font-medium'>
                Showing <strong className='text-foreground font-mono'>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of <strong className='text-foreground font-mono'>{totalItems}</strong> animals
              </span>

              <div className='flex items-center gap-1.5'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='h-8 text-xs gap-1 font-semibold'
                >
                  <ChevronLeft className='h-3.5 w-3.5' /> Previous
                </Button>

                <div className='flex items-center gap-1 px-2 font-mono text-xs font-bold text-muted-foreground'>
                  Page <span className='text-foreground font-extrabold'>{currentPage}</span> of {totalPages}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className='h-8 text-xs gap-1 font-semibold'
                >
                  Next <ChevronRight className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Widgets Sidebar (3 Cols) */}
        <div className='lg:col-span-3'>
          <AnimalSidebarWidgets
            animals={store.animals}
            shelters={store.shelters}
            treatments={store.treatments}
            onSelectAnimal={handleOpenProfile}
          />
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className='sm:max-w-lg'>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Animal Record</DialogTitle>
              <DialogDescription>Create a new animal log. Set details, condition, and statuses.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4 h-105 overflow-y-auto pr-2'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Animal Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Buddy' required />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Species</span>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Dog'>Dog</option>
                    <option value='Cat'>Cat</option>
                    <option value='Bird'>Bird</option>
                    <option value='Rabbit'>Rabbit</option>
                    <option value='Horse'>Horse</option>
                    <option value='Chicken'>Chicken</option>
                    <option value='Reptile'>Reptile</option>
                    <option value='Other'>Other</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Breed</span>
                  <Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder='Golden Retriever Mix' />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Sex</span>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Unknown'>Unknown</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Estimated Age</span>
                  <Input value={estimatedAge} onChange={(e) => setEstimatedAge(e.target.value)} placeholder='e.g., 2 years' />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Weight (kg)</span>
                  <Input type='number' step='0.1' value={weight || ''} onChange={(e) => setWeight(Number(e.target.value))} placeholder='e.g., 12.5' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Color</span>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder='e.g., Brindle' />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AnimalStatusType)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Intake'>Intake</option>
                    <option value='Under Treatment'>Under Treatment</option>
                    <option value='Recovered'>Recovered</option>
                    <option value='Ready for Adoption'>Ready for Adoption</option>
                    <option value='Ready for Release'>Ready for Release</option>
                    <option value='Adopted'>Adopted</option>
                    <option value='Released'>Released</option>
                  </select>
                </div>
              </div>

              <AnimalPhotoUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                species={species}
              />

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Current Shelter</span>
                  <select
                    value={shelterId}
                    onChange={(e) => setShelterId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value=''>No Shelter Assigned</option>
                    {store.shelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Rescue Case Reference</span>
                  <select
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value=''>No Rescue Case Link</option>
                    {store.cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Condition & Medical Overview</span>
                <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} placeholder='Note fractures, infections, starvation or general health...' />
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Rescue Observations & Behavioral Notes</span>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Behavioral observation notes, temperament, intake details...' />
              </div>
            </div>
            <DialogFooter className='pt-2'>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Register Animal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-lg'>
          {selectedAnimal && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Animal {selectedAnimal.name}</DialogTitle>
                <DialogDescription>Modify parameters or change recovery/adoption status.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4 h-105 overflow-y-auto pr-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Animal Name</span>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Species</span>
                    <select
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Dog'>Dog</option>
                      <option value='Cat'>Cat</option>
                      <option value='Bird'>Bird</option>
                      <option value='Rabbit'>Rabbit</option>
                      <option value='Horse'>Horse</option>
                      <option value='Chicken'>Chicken</option>
                      <option value='Reptile'>Reptile</option>
                      <option value='Other'>Other</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Breed</span>
                    <Input value={breed} onChange={(e) => setBreed(e.target.value)} />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Sex</span>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Male'>Male</option>
                      <option value='Female'>Female</option>
                      <option value='Unknown'>Unknown</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Estimated Age</span>
                    <Input value={estimatedAge} onChange={(e) => setEstimatedAge(e.target.value)} />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Weight (kg)</span>
                    <Input type='number' step='0.1' value={weight || ''} onChange={(e) => setWeight(Number(e.target.value))} />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Color</span>
                    <Input value={color} onChange={(e) => setColor(e.target.value)} />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AnimalStatusType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Intake'>Intake</option>
                      <option value='Under Treatment'>Under Treatment</option>
                      <option value='Recovered'>Recovered</option>
                      <option value='Ready for Adoption'>Ready for Adoption</option>
                      <option value='Ready for Release'>Ready for Release</option>
                      <option value='Adopted'>Adopted</option>
                      <option value='Released'>Released</option>
                    </select>
                  </div>
                </div>

                <AnimalPhotoUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  species={species}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Current Shelter</span>
                    <select
                      value={shelterId}
                      onChange={(e) => setShelterId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>No Shelter Assigned</option>
                      {store.shelters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Rescue Case Reference</span>
                    <select
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>No Rescue Case Link</option>
                      {store.cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.case_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Condition & Medical Overview</span>
                  <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Rescue Observations & Behavioral Notes</span>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Behavioral observation notes, temperament, intake details...' />
                </div>
              </div>
              <DialogFooter className='pt-2'>
                <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Animal Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this animal record? This will clean up the entries but leaves related treatments intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Animal Profile Dialog */}
      <AnimalProfileDialog
        animal={selectedAnimal}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onEditClick={() => {
          setIsProfileOpen(false)
          if (selectedAnimal) handleOpenEdit(selectedAnimal)
        }}
      />

      {/* Ready for Adoption / Release Modal */}
      <ReadyModal
        type={readyModalType}
        open={readyModalType !== null}
        onOpenChange={(open) => !open && setReadyModalType(null)}
        animals={store.animals}
        shelters={store.shelters}
        onSelectAnimal={handleOpenProfile}
      />
    </div>
  )
}
