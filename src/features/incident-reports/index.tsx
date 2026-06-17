import { useState } from 'react'
import { useRescueHubStore, type IncidentReport, type SeverityType, type IncidentStatusType } from '@/stores/rescue-hub-store'
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
import { Plus, Search, Edit2, Trash2, ShieldAlert, ArrowRight, MapPin } from 'lucide-react'
import { MockMapView } from '@/components/mock-map-view'

export function IncidentReports() {
  const store = useRescueHubStore()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [isMapOpen, setIsMapOpen] = useState(false)

  // Dialogue States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPromoteOpen, setIsPromoteOpen] = useState(false)

  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)

  // Form States
  const [reporterName, setReporterName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<SeverityType>('Medium')
  const [status, setStatus] = useState<IncidentStatusType>('Pending')

  // Promote States
  const [assignRescuerId, setAssignRescuerId] = useState('')
  const [assignShelterId, setAssignShelterId] = useState('')

  // Handlers
  const handleOpenAdd = () => {
    setReporterName('')
    setLocation('')
    setDescription('')
    setSeverity('Medium')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reporterName || !location || !description) {
      toast.error('All fields are required.')
      return
    }

    store.addIncident({
      reporter_name: reporterName,
      report_date: new Date().toISOString(),
      location,
      description,
      severity,
      status: 'Pending'
    })

    setIsAddOpen(false)
    toast.success('Incident report submitted successfully.')
  }

  const handleOpenEdit = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setReporterName(inc.reporter_name)
    setLocation(inc.location)
    setDescription(inc.description)
    setSeverity(inc.severity)
    setStatus(inc.status)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncident) return

    store.updateIncident(selectedIncident.id, {
      reporter_name: reporterName,
      location,
      description,
      severity,
      status
    })

    setIsEditOpen(false)
    toast.success('Incident report updated.')
  }

  const handleOpenDelete = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedIncident) return
    store.deleteIncident(selectedIncident.id)
    setIsDeleteOpen(false)
    toast.success('Incident report deleted.')
  }

  const handleOpenPromote = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setAssignRescuerId('')
    setAssignShelterId('')
    setIsPromoteOpen(true)
  }

  const handlePromoteConfirm = () => {
    if (!selectedIncident) return
    // Check if the incident is already linked to a case
    const alreadyPromoted = store.cases.some((c) => c.incident_id === selectedIncident.id)
    if (alreadyPromoted) {
      toast.error('This incident has already been promoted to a case.')
      setIsPromoteOpen(false)
      return
    }

    store.promoteIncidentToCase(
      selectedIncident.id,
      assignRescuerId || undefined,
      assignShelterId || undefined
    )

    setIsPromoteOpen(false)
    toast.success('Incident promoted! Active Rescue Case and Animal record created.')
  }

  // Filters
  const filteredIncidents = store.incidents.filter((inc) => {
    const matchesSearch =
      inc.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
      inc.location.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase())

    const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter

    return matchesSearch && matchesSeverity
  })

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

  const getStatusColor = (st: IncidentStatusType) => {
    switch (st) {
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      case 'Approved':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'Rejected':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Incident Reports</h2>
          <p className='text-muted-foreground'>
            Receive and review citizen incident reports, then approve and promote them to active rescue cases.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className='flex gap-2'>
          <Plus className='h-4 w-4' /> Report Incident
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-4 py-4 bg-muted/20 p-4 rounded-lg border'>
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search reporter, location, description...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9'
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Severity Filter:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          >
            <option value='All'>All Severities</option>
            <option value='Low'>Low</option>
            <option value='Medium'>Medium</option>
            <option value='High'>High</option>
            <option value='Critical'>Critical</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Date Reported</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className='max-w-[300px]'>Description</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>
                  No incident reports found.
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((inc) => {
                const isPromoted = store.cases.some((c) => c.incident_id === inc.id)

                return (
                  <TableRow key={inc.id}>
                    <TableCell className='font-semibold'>{inc.reporter_name}</TableCell>
                    <TableCell>{new Date(inc.report_date).toLocaleString()}</TableCell>
                    <TableCell>{inc.location}</TableCell>
                    <TableCell className='max-w-[300px] truncate'>{inc.description}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(inc.severity)} variant='outline'>
                        {inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(inc.status)} variant='outline'>
                        {inc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {inc.status === 'Pending' && !isPromoted && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex gap-1 h-8 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                            onClick={() => handleOpenPromote(inc)}
                          >
                            <ArrowRight className='h-3 w-3' /> Promote
                          </Button>
                        )}
                        {isPromoted && (
                          <Badge variant='outline' className='bg-green-500/10 text-green-500 border-green-500/20'>
                            Promoted
                          </Badge>
                        )}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground'
                          onClick={() => handleOpenEdit(inc)}
                        >
                          <Edit2 className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                          onClick={() => handleOpenDelete(inc)}
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
              <DialogTitle>Report New Animal Incident</DialogTitle>
              <DialogDescription>
                Fill out the report details. This will be queued for approval by dispatch.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Reporter Name</span>
                <Input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder='Jane Doe'
                  required
                />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Location</span>
                <div className='flex gap-2'>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='e.g., 23rd Street Bridge, North Side'
                    required
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => setIsMapOpen(true)}
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
                  placeholder='Describe the animal, species, size, and distress level...'
                  required
                />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Urgency / Severity</span>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityType)}
                  className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                >
                  <option value='Low'>Low (Non-urgent, safe area)</option>
                  <option value='Medium'>Medium (Stray, needs attention)</option>
                  <option value='High'>High (Injured, cold/hot exposure)</option>
                  <option value='Critical'>Critical (Trapped, immediate danger)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Submit Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Incident Report</DialogTitle>
              <DialogDescription>Modify incident info or change approval status.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Reporter Name</span>
                <Input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Location</span>
                <div className='flex gap-2'>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => setIsMapOpen(true)}
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
                  required
                />
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Urgency / Severity</span>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityType)}
                  className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                >
                  <option value='Low'>Low</option>
                  <option value='Medium'>Medium</option>
                  <option value='High'>High</option>
                  <option value='Critical'>Critical</option>
                </select>
              </div>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IncidentStatusType)}
                  className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                >
                  <option value='Pending'>Pending Review</option>
                  <option value='Approved'>Approved (Verified)</option>
                  <option value='Rejected'>Rejected</option>
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
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this incident report? This action cannot be undone.
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

      {/* Promote to Case Dialog */}
      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ShieldAlert className='h-5 w-5 text-blue-500' /> Promote to Rescue Case
            </DialogTitle>
            <DialogDescription>
              This will change the report status to **Approved**, create an active **Rescue Case**, and register an **Animal** record in the system.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-1 bg-muted p-3 rounded text-sm'>
              <p className='font-semibold'>Incident Details:</p>
              <p className='text-muted-foreground'>{selectedIncident?.description}</p>
              <p className='text-xs mt-1 text-muted-foreground'>Location: {selectedIncident?.location}</p>
            </div>
            <div className='space-y-1'>
              <span className='text-sm font-medium'>Assign Rescuer (Optional)</span>
              <select
                value={assignRescuerId}
                onChange={(e) => setAssignRescuerId(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              >
                <option value=''>Unassigned (Reporter Status)</option>
                {store.rescuers
                  .filter((r) => r.availability === 'Available')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.skills.split(',')[0]})
                    </option>
                  ))}
              </select>
              <p className='text-xs text-muted-foreground'>Only available rescuers are shown.</p>
            </div>

            <div className='space-y-1'>
              <span className='text-sm font-medium'>Assign Shelter (Optional)</span>
              <select
                value={assignShelterId}
                onChange={(e) => setAssignShelterId(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              >
                <option value=''>No Shelter Assigned Yet</option>
                {store.shelters.map((s) => {
                  const occupied = store.animals.filter(
                    (a) => a.shelter_id === s.id && a.status !== 'Adopted' && a.status !== 'Released'
                  ).length
                  return (
                    <option key={s.id} value={s.id} disabled={occupied >= s.capacity}>
                      {s.name} (Occupied: {occupied}/{s.capacity})
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsPromoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteConfirm}>Promote & Dispatch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMapOpen && (
        <MockMapView
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          initialLocation={location}
          onConfirmLocation={(loc) => setLocation(loc)}
        />
      )}
    </div>
  )
}
