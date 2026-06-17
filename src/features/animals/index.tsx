import { useState } from 'react'
import { useRescueHubStore, type Animal, type AnimalStatusType } from '@/stores/rescue-hub-store'
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
import { Plus, Search, Edit2, Trash2, PawPrint } from 'lucide-react'

export function Animals() {
  const store = useRescueHubStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)

  // Form States
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState('Unknown')
  const [estimatedAge, setEstimatedAge] = useState('')
  const [weight, setWeight] = useState(0)
  const [color, setColor] = useState('')
  const [condition, setCondition] = useState('')
  const [status, setStatus] = useState<AnimalStatusType>('Intake')
  const [photoUrl, setPhotoUrl] = useState('')
  const [shelterId, setShelterId] = useState('')
  const [caseId, setCaseId] = useState('')

  // Handlers
  const handleOpenAdd = () => {
    setName('')
    setSpecies('Dog')
    setBreed('')
    setSex('Unknown')
    setEstimatedAge('')
    setWeight(0)
    setColor('')
    setCondition('Healthy')
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

    // Default image if empty
    const finalPhoto = photoUrl.trim() || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop'

    store.addAnimal({
      name,
      species,
      breed: breed || 'Unknown Mix',
      sex,
      estimated_age: estimatedAge || 'Unknown',
      weight: Number(weight) || 0,
      color: color || 'Unknown',
      condition,
      status,
      photo_url: finalPhoto,
      shelter_id: shelterId || null,
      case_id: caseId || null
    })

    setIsAddOpen(false)
    toast.success('Animal record registered successfully.')
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
      status,
      photo_url: photoUrl || null,
      shelter_id: shelterId || null,
      case_id: caseId || null
    })

    setIsEditOpen(false)
    toast.success('Animal record updated.')
  }

  const handleOpenDelete = (a: Animal) => {
    setSelectedAnimal(a)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedAnimal) return
    store.deleteAnimal(selectedAnimal.id)
    setIsDeleteOpen(false)
    toast.success('Animal record deleted.')
  }

  // Filters
  const filteredAnimals = store.animals.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.species.toLowerCase().includes(search.toLowerCase()) ||
      a.breed.toLowerCase().includes(search.toLowerCase()) ||
      a.color.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (st: AnimalStatusType) => {
    switch (st) {
      case 'Intake':
        return 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
      case 'Under Treatment':
        return 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
      case 'Recovered':
        return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
      case 'Adopted':
        return 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400'
      case 'Released':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Animals Register</h2>
          <p className='text-muted-foreground'>
            Manage registered animals, track their conditions, and oversee their rescue and shelter statuses.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className='flex gap-2'>
          <Plus className='h-4 w-4' /> Add Animal Record
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-4 py-4 bg-muted/20 p-4 rounded-lg border'>
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search name, species, breed, color...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9'
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
          >
            <option value='All'>All Statuses</option>
            <option value='Intake'>Intake</option>
            <option value='Under Treatment'>Under Treatment</option>
            <option value='Recovered'>Recovered</option>
            <option value='Adopted'>Adopted</option>
            <option value='Released'>Released</option>
          </select>
        </div>
      </div>

      {/* Animals Table */}
      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[80px]'>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Species & Breed</TableHead>
              <TableHead>Sex & Age</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Shelter</TableHead>
              <TableHead>Case Ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnimals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                  No animal records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAnimals.map((a) => {
                const shelter = store.shelters.find((s) => s.id === a.shelter_id)
                const rescueCase = store.cases.find((c) => c.id === a.case_id)

                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.photo_url ? (
                        <img
                          src={a.photo_url}
                          alt={a.name}
                          className='h-10 w-10 rounded-full object-cover border'
                        />
                      ) : (
                        <div className='h-10 w-10 rounded-full bg-muted flex items-center justify-center border'>
                          <PawPrint className='h-5 w-5 text-muted-foreground' />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='font-semibold'>{a.name}</TableCell>
                    <TableCell>
                      <div className='font-medium'>{a.species}</div>
                      <div className='text-xs text-muted-foreground'>{a.breed}</div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>{a.sex}</div>
                      <div className='text-xs text-muted-foreground'>{a.estimated_age}</div>
                    </TableCell>
                    <TableCell>{a.weight} kg</TableCell>
                    <TableCell>{shelter ? shelter.name : <span className='text-muted-foreground italic text-xs'>None</span>}</TableCell>
                    <TableCell>
                      {rescueCase ? (
                        <span className='font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400'>
                          {rescueCase.case_number}
                        </span>
                      ) : (
                        <span className='text-muted-foreground italic text-xs'>None</span>
                      )}
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
                          className='h-8 w-8 text-muted-foreground'
                          onClick={() => handleOpenEdit(a)}
                        >
                          <Edit2 className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                          onClick={() => handleOpenDelete(a)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
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
                    <option value='Adopted'>Adopted</option>
                    <option value='Released'>Released</option>
                  </select>
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Profile Photo URL</span>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder='https://images.unsplash.com/...'
                />
              </div>

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
                <span className='text-sm font-medium'>Condition & Medical Notes</span>
                <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} placeholder='Note fractures, infections, starvation or general health...' />
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
                      <option value='Adopted'>Adopted</option>
                      <option value='Released'>Released</option>
                    </select>
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Profile Photo URL</span>
                  <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
                </div>

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
                  <span className='text-sm font-medium'>Condition & Medical Notes</span>
                  <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} />
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
              Are you sure you want to delete this animal record? This will clean up the entries but leaves related treatments intact (they will refer to an empty animal link).
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
    </div>
  )
}
