import { useState } from 'react'
import { useRescueHubStore, type RescueCase, type RescueCaseStatusType, type SeverityType, VALID_CASE_TRANSITIONS } from '@/stores/rescue-hub-store'
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
import { Plus, Search, Edit2, Trash2, ShieldAlert, MapPin } from 'lucide-react'
import { MockMapView } from '@/components/mock-map-view'

export function RescueCases() {
  const store = useRescueHubStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState<'add' | 'edit'>('add')

  const [selectedCase, setSelectedCase] = useState<RescueCase | null>(null)

  // Add Case Form States
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<SeverityType>('Medium')
  const [notes, setNotes] = useState('')

  // Edit Case Form States
  const [editStatus, setEditStatus] = useState<RescueCaseStatusType>('REPORTED')
  const [editRescuerId, setEditRescuerId] = useState('')
  const [editShelterId, setEditShelterId] = useState('')
  const [editSeverity, setEditSeverity] = useState<SeverityType>('Medium')
  const [editNotes, setEditNotes] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Handlers
  const handleOpenAdd = () => {
    setLocation('')
    setDescription('')
    setSeverity('Medium')
    setNotes('')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location || !description) {
      toast.error('Location and Description are required.')
      return
    }

    store.addCase({
      incident_id: null,
      report_date: new Date().toISOString(),
      rescue_date: null,
      location,
      description,
      severity,
      status: 'REPORTED',
      rescuer_id: null,
      shelter_id: null,
      animal_id: null,
      notes
    })

    setIsAddOpen(false)
    toast.success('New Rescue Case registered.')
  }

  const handleOpenEdit = (c: RescueCase) => {
    setSelectedCase(c)
    setEditStatus(c.status)
    setEditRescuerId(c.rescuer_id || '')
    setEditShelterId(c.shelter_id || '')
    setEditSeverity(c.severity)
    setEditNotes(c.notes)
    setEditLocation(c.location)
    setEditDescription(c.description)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCase) return

    // Perform updates
    const errorMsg = store.updateCase(selectedCase.id, {
      status: editStatus,
      rescuer_id: editRescuerId || null,
      shelter_id: editShelterId || null,
      severity: editSeverity,
      notes: editNotes,
      location: editLocation,
      description: editDescription,
      // If transitioning to RESCUED, record rescue date
      rescue_date: editStatus === 'RESCUED' && selectedCase.status !== 'RESCUED' ? new Date().toISOString() : selectedCase.rescue_date
    })

    if (errorMsg) {
      toast.error(errorMsg)
      return
    }

    setIsEditOpen(false)
    toast.success('Rescue Case updated successfully.')
  }

  const handleOpenDelete = (c: RescueCase) => {
    setSelectedCase(c)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedCase) return
    store.deleteCase(selectedCase.id)
    setIsDeleteOpen(false)
    toast.success('Rescue Case deleted.')
  }

  // Filters
  const filteredCases = store.cases.filter((c) => {
    const matchesSearch =
      c.case_number.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Format Status Badge
  const getStatusBadge = (st: RescueCaseStatusType) => {
    switch (st) {
      case 'REPORTED':
        return 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20'
      case 'ASSIGNED':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'EN_ROUTE':
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'RESCUED':
        return 'bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-500/20'
      case 'SHELTER_INTAKE':
        return 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      case 'UNDER_TREATMENT':
        return 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-500/20'
      case 'RECOVERED':
        return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case 'ADOPTED':
        return 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-500/20'
      case 'RELEASED':
        return 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
      case 'CLOSED':
        return 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-slate-500/20'
    }
  }

  const getSeverityColor = (sev: SeverityType) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'High':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'Medium':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'Low':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Rescue Cases</h2>
          <p className='text-muted-foreground'>
            Coordinate active dispatches, assign responders and shelters, and track cases through completion.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className='flex gap-2'>
          <Plus className='h-4 w-4' /> Register Case
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap items-center justify-between gap-4 py-4 bg-muted/20 p-4 rounded-lg border'>
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search Case Number, location, description...'
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
            className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          >
            <option value='All'>All Statuses</option>
            <option value='REPORTED'>REPORTED</option>
            <option value='ASSIGNED'>ASSIGNED</option>
            <option value='EN_ROUTE'>EN_ROUTE</option>
            <option value='RESCUED'>RESCUED</option>
            <option value='SHELTER_INTAKE'>SHELTER_INTAKE</option>
            <option value='UNDER_TREATMENT'>UNDER_TREATMENT</option>
            <option value='RECOVERED'>RECOVERED</option>
            <option value='ADOPTED'>ADOPTED</option>
            <option value='RELEASED'>RELEASED</option>
            <option value='CLOSED'>CLOSED</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case #</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead>Rescuer</TableHead>
              <TableHead>Shelter</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                  No rescue cases found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((c) => {
                const rescuer = store.rescuers.find((r) => r.id === c.rescuer_id)
                const shelter = store.shelters.find((s) => s.id === c.shelter_id)
                const animal = store.animals.find((a) => a.id === c.animal_id)

                return (
                  <TableRow key={c.id}>
                    <TableCell className='font-mono font-bold text-sm text-blue-600 dark:text-blue-400'>
                      {c.case_number}
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate'>{c.location}</TableCell>
                    <TableCell>{animal ? animal.name : <span className='text-muted-foreground italic text-xs'>None</span>}</TableCell>
                    <TableCell>{rescuer ? rescuer.name : <span className='text-muted-foreground italic text-xs'>Unassigned</span>}</TableCell>
                    <TableCell>{shelter ? shelter.name : <span className='text-muted-foreground italic text-xs'>Unassigned</span>}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(c.severity)} variant='outline'>
                        {c.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(c.status)} variant='outline'>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground'
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                          onClick={() => handleOpenDelete(c)}
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
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Register Rescue Case</DialogTitle>
              <DialogDescription>Manually log a new animal rescue incident.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Location</span>
                <div className='flex gap-2'>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='e.g., 54 Elm St, Metro Area'
                    required
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => {
                      setMapTarget('add')
                      setIsMapOpen(true)
                    }}
                    className='shrink-0 h-9 w-9 text-primary'
                  >
                    <MapPin className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Description</span>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Describe incident, animal condition, etc...'
                  required
                />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Severity</span>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityType)}
                  className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                >
                  <option value='Low'>Low</option>
                  <option value='Medium'>Medium</option>
                  <option value='High'>High</option>
                  <option value='Critical'>Critical</option>
                </select>
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Notes</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Initial dispatcher notes...'
                />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Register Case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-lg' onPointerDownOutside={(e) => e.preventDefault()}>
          {selectedCase && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Update Case {selectedCase.case_number}</DialogTitle>
                <DialogDescription>
                  Modify dispatch settings, assign rescuers/shelters, and progress statuses.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4 h-105 overflow-y-auto pr-2'>
                <div className='space-y-1 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-xs flex flex-col gap-1'>
                  <span className='font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1'>
                    <ShieldAlert className='h-3.5 w-3.5' /> Status Workflow Guidelines
                  </span>
                  <span>
                    Cases must flow through sequential stages. The dropdown below restricts choices to valid next states.
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Status</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as RescueCaseStatusType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      {/* Current Status */}
                      <option value={selectedCase.status}>{selectedCase.status} (Current)</option>
                      {/* Valid Next Transitions */}
                      {VALID_CASE_TRANSITIONS[selectedCase.status]?.map((st) => (
                        <option key={st} value={st}>
                          ➔ {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Severity</span>
                    <select
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value as SeverityType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Low'>Low</option>
                      <option value='Medium'>Medium</option>
                      <option value='High'>High</option>
                      <option value='Critical'>Critical</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Assigned Rescuer</span>
                    <select
                      value={editRescuerId}
                      onChange={(e) => setEditRescuerId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>Unassigned</option>
                      {store.rescuers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.availability})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Current Shelter</span>
                    <select
                      value={editShelterId}
                      onChange={(e) => setEditShelterId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>Unassigned</option>
                      {store.shelters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Location</span>
                  <div className='flex gap-2'>
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      required
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => {
                        setMapTarget('edit')
                        setIsMapOpen(true)
                      }}
                      className='shrink-0 h-9 w-9 text-primary'
                    >
                      <MapPin className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Incident Description</span>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                  />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Case Notes</span>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder='Add update logs, dispatch instructions, veterinary logs link...'
                  />
                </div>
              </div>
              <DialogFooter className='pt-4'>
                <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Save Updates</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rescue Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this case? Doing so will not delete the associated animal but breaks linkages.
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

      {isMapOpen && (
        <MockMapView
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          initialLocation={mapTarget === 'add' ? location : editLocation}
          onConfirmLocation={(loc) => {
            if (mapTarget === 'add') {
              setLocation(loc)
            } else {
              setEditLocation(loc)
            }
          }}
        />
      )}
    </div>
  )
}
