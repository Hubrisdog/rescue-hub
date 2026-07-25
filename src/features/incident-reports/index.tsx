import { useState, useMemo } from 'react'
import {
  useRescueHubStore,
  type IncidentReport,
  type SeverityType,
} from '@/stores/rescue-hub-store'
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
  MapPin,
  Clock,
  Phone,
  Camera,
  Share2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react'
import { MockMapView } from '@/components/mock-map-view'
import { useNavigate } from '@tanstack/react-router'
import { IncidentStatsHeader } from './components/incident-stats-header'
import { IncidentDetailsDrawer } from './components/incident-details-drawer'

export function IncidentReports() {
  const store = useRescueHubStore()
  const navigate = useNavigate()
  const userRole = useAuthStore((state) => state.auth.user?.role?.[0] || 'Rescuer')

  // Search, Filters & Pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [speciesFilter, setSpeciesFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Dialog & Drawer States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isPromoteOpen, setIsPromoteOpen] = useState(false)
  const [isPhotoOpen, setIsPhotoOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')

  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)

  // Add Form
  const [reporterName, setReporterName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [species, setSpecies] = useState('Dog')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<SeverityType>('Medium')
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Edit Form
  const [editStatus, setEditStatus] = useState<IncidentReport['status']>('Pending')

  // Promote Form
  const [rescuerId, setRescuerId] = useState('')
  const [shelterId, setShelterId] = useState('')

  // Filter handler
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val)
    setCurrentPage(1)
  }

  // Handlers
  const handleOpenDrawer = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setIsDrawerOpen(true)
  }

  const handleOpenAdd = () => {
    setReporterName('')
    setContactNumber('')
    setSpecies('Dog')
    setLocation('')
    setDescription('')
    setSeverity('Medium')
    setIsAnonymous(false)
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location || !description) {
      toast.error('Location and Description are required.')
      return
    }

    store.addIncident({
      reporter_name: isAnonymous ? 'Anonymous Citizen' : reporterName || 'Citizen Reporter',
      contact_number: contactNumber || 'Unspecified',
      species,
      location,
      description,
      severity,
      photo: null,
      latitude: 14.5995,
      longitude: 120.9842,
      is_anonymous: isAnonymous,
    })

    setIsAddOpen(false)
    toast.success('Incident distress report logged into dispatch queue.')
  }

  const handleOpenPromote = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setRescuerId(store.rescuers[0]?.id || '')
    setShelterId(store.shelters[0]?.id || '')
    setIsPromoteOpen(true)
  }

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncident) return

    const err = await store.promoteIncidentToCase(selectedIncident.id, rescuerId || null, shelterId || null)
    if (err) {
      toast.error(err)
      return
    }

    setIsPromoteOpen(false)
    toast.success(`Incident validated and promoted into Rescue Case dispatch!`)
  }

  const handleOpenEdit = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setEditStatus(inc.status)
    setLocation(inc.location)
    setDescription(inc.description)
    setSeverity(inc.severity)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncident) return

    store.updateIncident(selectedIncident.id, {
      status: editStatus,
      location,
      description,
      severity,
    })

    setIsEditOpen(false)
    toast.success(`Incident report INC-2026-${selectedIncident.id.replace(/^inc-/, '').padStart(4, '0')} updated.`)
  }

  const handleOpenDelete = (inc: IncidentReport) => {
    setSelectedIncident(inc)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedIncident) return
    const err = await store.deleteIncident(selectedIncident.id)
    if (err) {
      toast.error(err)
    } else {
      toast.success('Incident report removed.')
    }
    setIsDeleteOpen(false)
  }

  // Filtered List
  const filteredIncidents = useMemo(() => {
    return store.incidents.filter((inc) => {
      const s = search.toLowerCase()
      const rawIncId = inc.id.replace(/^inc-/, '')

      const linkedCase = store.cases.find(
        (c) =>
          c.incident_id === inc.id ||
          (c.incident_id && c.incident_id.replace(/^inc-/, '') === rawIncId)
      )

      const matchesSearch =
        inc.location.toLowerCase().includes(s) ||
        inc.description.toLowerCase().includes(s) ||
        (inc.reporter_name && inc.reporter_name.toLowerCase().includes(s)) ||
        inc.species.toLowerCase().includes(s) ||
        (linkedCase && linkedCase.case_number.toLowerCase().includes(s))

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Promoted'
          ? inc.status === 'Approved' || inc.status === 'Validated' || inc.status === 'Promoted' || !!linkedCase
          : inc.status === statusFilter

      const matchesPriority = priorityFilter === 'All' || inc.severity === priorityFilter
      const matchesSpecies = speciesFilter === 'All' || inc.species === speciesFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesSpecies
    })
  }, [store.incidents, store.cases, search, statusFilter, priorityFilter, speciesFilter])

  // Pagination calculation
  const totalItems = filteredIncidents.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage)

  // Species Emoji Mapping
  const getSpeciesIcon = (sp: string) => {
    switch (sp) {
      case 'Dog':
        return '🐶'
      case 'Cat':
        return '🐱'
      case 'Bird':
        return '🐦'
      case 'Rabbit':
        return '🐰'
      case 'Reptile':
      case 'Snake':
        return '🐍'
      default:
        return '🐾'
    }
  }

  // Priority Badges (Clean UI without circle emojis)
  const getPriorityBadge = (priority: SeverityType) => {
    switch (priority) {
      case 'Critical':
        return <Badge className='bg-red-500 text-white font-bold text-[11px] shadow-sm'>Critical</Badge>
      case 'High':
        return <Badge className='bg-amber-500 text-slate-950 font-bold text-[11px] shadow-sm'>High</Badge>
      case 'Medium':
        return <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-[11px]'>Medium</Badge>
      case 'Low':
      default:
        return <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-[11px]'>Low</Badge>
    }
  }

  // Response Timer Alert
  const getResponseTimer = (dateStr: string) => {
    const elapsedMins = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000))
    if (elapsedMins < 30) {
      return (
        <span className='text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'>
          {elapsedMins} mins
        </span>
      )
    } else if (elapsedMins < 60) {
      return (
        <span className='text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20'>
          {elapsedMins} mins
        </span>
      )
    } else if (elapsedMins < 240) {
      return (
        <span className='text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20'>
          {Math.round(elapsedMins / 60)} hrs
        </span>
      )
    } else {
      return (
        <span className='text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse'>
          Overdue ({Math.round(elapsedMins / 60)} hrs)
        </span>
      )
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6 max-w-[1600px] mx-auto'>
      {/* Module Title Header & Action Button */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b'>
        <div>
          <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
            📋 Distress Incident Triage Center
          </h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Receive citizen distress calls, triage emergency severity, validate coordinates, and dispatch rescue teams.
          </p>
        </div>

        <Button onClick={handleOpenAdd} size='sm' className='flex gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'>
          <Plus className='h-4 w-4' /> Log Citizen Distress Call
        </Button>
      </div>

      {/* 1. Summary Statistics Header */}
      <IncidentStatsHeader incidents={store.incidents} cases={store.cases} />

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm'>
        {/* Search Bar */}
        <div className='flex items-center gap-2 max-w-md w-full'>
          <Search className='h-4 w-4 text-muted-foreground shrink-0' />
          <Input
            placeholder='Search reporter, species, location, description, or case #'
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            className='h-9 text-xs'
          />
        </div>

        {/* Filters */}
        <div className='flex items-center gap-2 flex-wrap ml-auto text-xs'>
          <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Statuses</option>
            <option value='Pending'>Pending Validation</option>
            <option value='Promoted'>Validated & Promoted</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Priorities</option>
            <option value='Critical'>Critical</option>
            <option value='High'>High</option>
            <option value='Medium'>Medium</option>
            <option value='Low'>Low</option>
          </select>

          {/* Species Filter */}
          <select
            value={speciesFilter}
            onChange={(e) => handleFilterChange(setSpeciesFilter, e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Species</option>
            <option value='Dog'>Dog 🐶</option>
            <option value='Cat'>Cat 🐱</option>
            <option value='Bird'>Bird 🐦</option>
            <option value='Rabbit'>Rabbit 🐰</option>
            <option value='Reptile'>Reptile 🐍</option>
          </select>
        </div>
      </div>

      {/* Command Triage Table */}
      <div className='rounded-xl border bg-card overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in-50'>
        <Table>
          <TableHeader className='bg-muted/20'>
            <TableRow>
              <TableHead className='w-[100px]'>Report #</TableHead>
              <TableHead>Species & Visual</TableHead>
              <TableHead>Citizen Reporter</TableHead>
              <TableHead>Incident Location</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Response Elapsed</TableHead>
              <TableHead>Validation & Dispatch</TableHead>
              <TableHead className='text-right'>Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='h-32 text-center text-muted-foreground'>
                  No distress incident reports match your search or filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedIncidents.map((inc) => {
                const rawIncId = inc.id.replace(/^inc-/, '')

                const linkedCase = store.cases.find(
                  (c) =>
                    c.incident_id === inc.id ||
                    (c.incident_id && c.incident_id.replace(/^inc-/, '') === rawIncId)
                )

                const isAnon = inc.is_anonymous || !inc.reporter_name
                const reporterType = isAnon
                  ? '🕵 Anonymous'
                  : inc.reporter_name?.toLowerCase().includes('officer') || inc.reporter_name?.toLowerCase().includes('patrol')
                  ? '🚓 Partner'
                  : '👤 Citizen'

                return (
                  <TableRow
                    key={inc.id}
                    className='hover:bg-muted/30 cursor-pointer transition-colors'
                    onClick={() => handleOpenDrawer(inc)}
                  >
                    {/* Report # */}
                    <TableCell className='font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400'>
                      INC-2026-{rawIncId.padStart(4, '0')}
                    </TableCell>

                    {/* Species & Photo Thumbnail */}
                    <TableCell>
                      <div className='flex items-center gap-2.5'>
                        {inc.photo ? (
                          <img
                            src={inc.photo}
                            alt='Evidence'
                            onClick={(e) => {
                              e.stopPropagation()
                              setPhotoUrl(inc.photo!)
                              setIsPhotoOpen(true)
                            }}
                            className='h-8 w-8 rounded-lg object-cover border bg-slate-900 shrink-0 cursor-zoom-in hover:scale-105 transition-transform'
                          />
                        ) : (
                          <div className='h-8 w-8 rounded-lg bg-muted border flex items-center justify-center text-base shrink-0'>
                            {getSpeciesIcon(inc.species)}
                          </div>
                        )}
                        <div className='overflow-hidden space-y-0.5'>
                          <div className='font-bold text-xs text-foreground truncate flex items-center gap-1'>
                            <span>{getSpeciesIcon(inc.species)}</span> {inc.species}
                          </div>
                          <div className='text-[10px] text-muted-foreground truncate max-w-[130px]'>
                            {inc.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Reporter Directory */}
                    <TableCell className='text-xs'>
                      <div className='space-y-0.5'>
                        <span className='font-bold text-foreground block truncate flex items-center gap-1'>
                          {inc.reporter_name || 'Anonymous Citizen'}
                          <Badge variant='outline' className='text-[9px] px-1 py-0 border-muted text-muted-foreground font-normal'>
                            {reporterType}
                          </Badge>
                        </span>
                        <span className='text-[10px] font-mono text-muted-foreground block truncate flex items-center gap-1'>
                          <Phone className='h-2.5 w-2.5 text-emerald-500' /> {inc.contact_number || 'No contact'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell className='text-xs'>
                      <div className='space-y-0.5'>
                        <span className='font-medium text-foreground block truncate max-w-[180px] flex items-center gap-1'>
                          <MapPin className='h-3 w-3 text-rose-500 shrink-0' /> {inc.location}
                        </span>
                        <span className='text-[10px] font-mono text-muted-foreground block'>
                          GPS: {inc.latitude ? inc.latitude.toFixed(2) : '14.60'}, {inc.longitude ? inc.longitude.toFixed(2) : '120.98'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>{getPriorityBadge(inc.severity)}</TableCell>

                    {/* Response Timer */}
                    <TableCell>{getResponseTimer(inc.created_at || Date.now().toString())}</TableCell>

                    {/* Validation & Dispatch Action */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {linkedCase ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => navigate({ to: '/rescue-cases' })}
                          className='h-7 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 gap-1'
                        >
                          <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                          {linkedCase.case_number}
                          <ExternalLink className='h-3 w-3 ml-0.5' />
                        </Button>
                      ) : (
                        <Button
                          size='sm'
                          onClick={() => handleOpenPromote(inc)}
                          className='h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm'
                        >
                          <Share2 className='h-3.5 w-3.5' /> Approve & Create Case
                        </Button>
                      )}
                    </TableCell>

                    {/* Quick Actions */}
                    <TableCell className='text-right' onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1'
                          onClick={() => handleOpenDrawer(inc)}
                          title='View Details & Timeline'
                        >
                          <Eye className='h-3.5 w-3.5' /> View
                        </Button>
                        {(userRole === 'Admin' || userRole === 'Dispatcher') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-muted gap-1'
                            onClick={() => handleOpenEdit(inc)}
                            title='Edit Report'
                          >
                            <Edit2 className='h-3.5 w-3.5' /> Edit
                          </Button>
                        )}
                        {userRole === 'Admin' && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-rose-500 hover:bg-rose-500/10'
                            onClick={() => handleOpenDelete(inc)}
                            title='Delete Report'
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

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm text-xs'>
          <span className='text-muted-foreground font-medium'>
            Showing <strong className='text-foreground font-mono'>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of <strong className='text-foreground font-mono'>{totalItems}</strong> incident reports
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

      {/* Log Incident Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Log Citizen Distress Call</DialogTitle>
              <DialogDescription>Register an incoming emergency distress report.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='anonCheck'
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className='rounded border-input'
                />
                <label htmlFor='anonCheck' className='text-sm font-medium cursor-pointer'>
                  Anonymous Citizen Call
                </label>
              </div>

              {!isAnonymous && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Reporter Name</span>
                    <Input value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder='John Smith' />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Contact Phone</span>
                    <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder='0917-555-0199' />
                  </div>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Species</span>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Dog'>Dog 🐶</option>
                    <option value='Cat'>Cat 🐱</option>
                    <option value='Bird'>Bird 🐦</option>
                    <option value='Rabbit'>Rabbit 🐰</option>
                    <option value='Reptile'>Reptile 🐍</option>
                    <option value='Other'>Other 🐾</option>
                  </select>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Urgency Priority</span>
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
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Incident Address / Location</span>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder='Talamban Highway, Zone 3, Cebu City' required />
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Distress Description</span>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Injured stray animal on roadside...' required />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Submit Incident Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve & Create Case Dialog */}
      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent>
          {selectedIncident && (
            <form onSubmit={handlePromoteSubmit}>
              <DialogHeader>
                <DialogTitle>Approve & Create Rescue Case</DialogTitle>
                <DialogDescription>
                  Promote Incident INC-2026-{selectedIncident.id.replace(/^inc-/, '').padStart(4, '0')} to active dispatch.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='p-3 rounded-xl bg-card border text-xs space-y-1'>
                  <span className='font-bold text-foreground block'>
                    {selectedIncident.species} in distress at {selectedIncident.location}
                  </span>
                  <p className='text-muted-foreground italic'>"{selectedIncident.description}"</p>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Assign Field Rescuer</span>
                  <select
                    value={rescuerId}
                    onChange={(e) => setRescuerId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value=''>Unassigned (Dispatch Later)</option>
                    {store.rescuers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Assign Intake Shelter Station</span>
                  <select
                    value={shelterId}
                    onChange={(e) => setShelterId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value=''>Unassigned Shelter</option>
                    {store.shelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.capacity} beds)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setIsPromoteOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold'>
                  Approve & Launch Case
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedIncident && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Incident Report</DialogTitle>
                <DialogDescription>Modify triage details or validation status.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Status</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Pending'>Pending Validation</option>
                      <option value='Approved'>Approved / Validated</option>
                    </select>
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
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Location</span>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Description</span>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Save Report</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident Report</DialogTitle>
            <DialogDescription>Are you sure you want to remove this distress report?</DialogDescription>
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

      {/* Incident Details Drawer */}
      <IncidentDetailsDrawer
        incident={selectedIncident}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onPromoteClick={handleOpenPromote}
      />

      {/* Photo Preview Dialog */}
      <Dialog open={isPhotoOpen} onOpenChange={setIsPhotoOpen}>
        <DialogContent className='sm:max-w-xl p-0 overflow-hidden bg-slate-950 border-slate-800'>
          <div className='relative flex items-center justify-center p-4'>
            <img src={photoUrl} alt='Evidence full view' className='max-h-[80vh] w-auto object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
