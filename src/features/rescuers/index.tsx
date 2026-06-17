import { useState } from 'react'
import { useRescueHubStore, type Rescuer, type RescuerAvailabilityType } from '@/stores/rescue-hub-store'
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

export function Rescuers() {
  const store = useRescueHubStore()
  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('All')

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedRescuer, setSelectedRescuer] = useState<Rescuer | null>(null)

  // Form States
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [skills, setSkills] = useState('')
  const [availability, setAvailability] = useState<RescuerAvailabilityType>('Available')

  // Handlers
  const handleOpenAdd = () => {
    setName('')
    setPhone('')
    setEmail('')
    setSkills('')
    setAvailability('Available')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone) {
      toast.error('Name, Email, and Phone are required.')
      return
    }

    store.addRescuer({
      name,
      phone,
      email,
      skills: skills || 'General Handler',
      availability
    })

    setIsAddOpen(false)
    toast.success('Rescuer profile registered successfully.')
  }

  const handleOpenEdit = (r: Rescuer) => {
    setSelectedRescuer(r)
    setName(r.name)
    setPhone(r.phone)
    setEmail(r.email)
    setSkills(r.skills)
    setAvailability(r.availability)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRescuer) return

    store.updateRescuer(selectedRescuer.id, {
      name,
      phone,
      email,
      skills,
      availability
    })

    setIsEditOpen(false)
    toast.success('Rescuer profile updated.')
  }

  const handleOpenDelete = (r: Rescuer) => {
    setSelectedRescuer(r)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedRescuer) return
    store.deleteRescuer(selectedRescuer.id)
    setIsDeleteOpen(false)
    toast.success('Rescuer profile deleted.')
  }

  // Filters
  const filteredRescuers = store.rescuers.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.skills.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())

    const matchesAvailability = availabilityFilter === 'All' || r.availability === availabilityFilter

    return matchesSearch && matchesAvailability
  })

  const getAvailabilityBadge = (av: RescuerAvailabilityType) => {
    switch (av) {
      case 'Available':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'Busy':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'On Leave':
        return 'bg-slate-500/10 text-slate-500'
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Rescuers Roster</h2>
          <p className='text-muted-foreground'>
            Manage volunteer rescuers, track their certifications or handling skills, and oversee availability.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className='flex gap-2'>
          <Plus className='h-4 w-4' /> Add Rescuer Profile
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-4 py-4 bg-muted/20 p-4 rounded-lg border'>
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search name, skills, email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9'
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Availability Filter:</span>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
          >
            <option value='All'>All Availabilities</option>
            <option value='Available'>Available</option>
            <option value='Busy'>Busy</option>
            <option value='On Leave'>On Leave</option>
          </select>
        </div>
      </div>

      {/* Rescuers Table */}
      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Skills & Capabilities</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRescuers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                  No rescuers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRescuers.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-semibold'>{r.name}</TableCell>
                  <TableCell>
                    <div className='text-sm'>{r.phone}</div>
                    <div className='text-xs text-muted-foreground'>{r.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {r.skills.split(',').map((skill) => (
                        <Badge key={skill} variant='outline' className='text-xs bg-slate-50 dark:bg-slate-800/50'>
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAvailabilityBadge(r.availability)} variant='secondary'>
                      {r.availability}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-muted-foreground'
                        onClick={() => handleOpenEdit(r)}
                      >
                        <Edit2 className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                        onClick={() => handleOpenDelete(r)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add Rescuer Profile</DialogTitle>
              <DialogDescription>Create a new responder dossier for incident dispatching.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Full Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Mark Davis' required />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Phone Number</span>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='555-0100' required />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Email Address</span>
                  <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='mark@rescuehub.org' required />
                </div>
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Skills (comma separated)</span>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder='e.g., Canine Handling, Trapping, First Aid'
                />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Initial Availability</span>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as RescuerAvailabilityType)}
                  className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                >
                  <option value='Available'>Available</option>
                  <option value='Busy'>Busy</option>
                  <option value='On Leave'>On Leave</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Register Rescuer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedRescuer && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Rescuer Profile {selectedRescuer.name}</DialogTitle>
                <DialogDescription>Modify contact settings, credentials, or availability.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Full Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Phone Number</span>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Email Address</span>
                    <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Skills (comma separated)</span>
                  <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Availability Status</span>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as RescuerAvailabilityType)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Available'>Available</option>
                    <option value='Busy'>Busy</option>
                    <option value='On Leave'>On Leave</option>
                  </select>
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
            <DialogTitle>Delete Rescuer Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rescuer profile? Associated dispatch logs will show 'Unassigned' rescuers.
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
