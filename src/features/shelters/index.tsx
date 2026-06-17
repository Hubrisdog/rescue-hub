import { useState } from 'react'
import { useRescueHubStore, type Shelter } from '@/stores/rescue-hub-store'
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
import { toast } from 'sonner'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'

export function Shelters() {
  const store = useRescueHubStore()
  const [search, setSearch] = useState('')

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null)

  // Form States
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [capacity, setCapacity] = useState(10)

  // Handlers
  const handleOpenAdd = () => {
    setName('')
    setAddress('')
    setContactPerson('')
    setCapacity(10)
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !address || !contactPerson) {
      toast.error('All fields are required.')
      return
    }

    store.addShelter({
      name,
      address,
      contact_person: contactPerson,
      capacity: Number(capacity) || 10
    })

    setIsAddOpen(false)
    toast.success('Shelter added successfully.')
  }

  const handleOpenEdit = (s: Shelter) => {
    setSelectedShelter(s)
    setName(s.name)
    setAddress(s.address)
    setContactPerson(s.contact_person)
    setCapacity(s.capacity)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShelter) return

    store.updateShelter(selectedShelter.id, {
      name,
      address,
      contact_person: contactPerson,
      capacity: Number(capacity) || 10
    })

    setIsEditOpen(false)
    toast.success('Shelter details updated.')
  }

  const handleOpenDelete = (s: Shelter) => {
    setSelectedShelter(s)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedShelter) return
    store.deleteShelter(selectedShelter.id)
    setIsDeleteOpen(false)
    toast.success('Shelter removed.')
  }

  // Filters
  const filteredShelters = store.shelters.filter((s) => {
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(search.toLowerCase())
    )
  })

  // Computes occupancy based on how many animals currently reside in this shelter and are active
  const getOccupancyCount = (shelterId: string) => {
    return store.animals.filter(
      (a) => a.shelter_id === shelterId && a.status !== 'Adopted' && a.status !== 'Released'
    ).length
  }

  const getOccupancyColor = (current: number, max: number) => {
    const pct = max > 0 ? (current / max) * 100 : 0
    if (pct >= 90) {
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    } else if (pct >= 75) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    } else {
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Shelters & Capacity</h2>
          <p className='text-muted-foreground'>
            Track sanctuary and shelter locations, contact details, total capacities, and current occupancies.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className='flex gap-2'>
          <Plus className='h-4 w-4' /> Add Shelter
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-4 py-4 bg-muted/20 p-4 rounded-lg border'>
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search name, address, contact person...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9'
          />
        </div>
      </div>

      {/* Shelters Table */}
      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shelter Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Current Occupancy</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShelters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  No shelters found.
                </TableCell>
              </TableRow>
            ) : (
              filteredShelters.map((s) => {
                const occupancy = getOccupancyCount(s.id)
                const util = s.capacity > 0 ? Math.round((occupancy / s.capacity) * 100) : 0

                return (
                  <TableRow key={s.id}>
                    <TableCell className='font-semibold'>{s.name}</TableCell>
                    <TableCell>{s.address}</TableCell>
                    <TableCell>{s.contact_person}</TableCell>
                    <TableCell>{s.capacity} beds</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold text-sm'>{occupancy} / {s.capacity}</span>
                        <Badge className={getOccupancyColor(occupancy, s.capacity)} variant='outline'>
                          {util}% full
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground'
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Edit2 className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                          onClick={() => handleOpenDelete(s)}
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
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add Shelter Location</DialogTitle>
              <DialogDescription>Create a new shelter facility with capacity details.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Shelter Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Acme Animal House' required />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Address</span>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder='123 Main St, Cityville' required />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Contact Person</span>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder='John Doe' required />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Bed Capacity</span>
                  <Input type='number' value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Create Shelter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedShelter && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Shelter {selectedShelter.name}</DialogTitle>
                <DialogDescription>Modify address details or total capacity limits.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Shelter Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Address</span>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Contact Person</span>
                    <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Bed Capacity</span>
                    <Input type='number' value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
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
            <DialogTitle>Delete Shelter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shelter? Animals assigned here will lose their shelter assignment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
