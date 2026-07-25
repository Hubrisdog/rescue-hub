import { useState, useMemo } from 'react'
import { useRescueHubStore, type Rescuer, type PersonnelRoleType, type PersonnelStatusType } from '@/stores/rescue-hub-store'
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
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Building2,
  Stethoscope,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  SlidersHorizontal,
  Briefcase,
  MapPin,
  ShieldAlert,
} from 'lucide-react'
import { PersonnelDetailDrawer } from './components/personnel-detail-drawer'

export function Rescuers() {
  const store = useRescueHubStore()
  const userRole = useAuthStore((state) => state.auth.user?.role?.[0] || 'Rescuer')

  // Search & Filter States
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [shelterFilter, setShelterFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Drawer & Dialog States
  const [selectedPersonnel, setSelectedPersonnel] = useState<Rescuer | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Add / Edit Form States
  const [name, setName] = useState('')
  const [role, setRole] = useState<PersonnelRoleType>('Rescuer')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<PersonnelStatusType>('Available')
  const [shelterId, setShelterId] = useState('')
  const [skills, setSkills] = useState('')

  // Admin Reset Password states
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  const handleResetPassword = async (r: Rescuer) => {
    try {
      const rawId = r.id.replace(/^(res|agt)-/, '')
      const token = useAuthStore.getState().auth.accessToken
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${rawId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Reset failed')
      const data = await res.json()
      setTempPassword(data.tempPassword)
      setSelectedPersonnel(r)
      setIsResetOpen(true)
    } catch (e) {
      toast.error('Could not reset password.')
    }
  }

  // Handlers
  const handleOpenDrawer = (r: Rescuer) => {
    setSelectedPersonnel(r)
    setIsDrawerOpen(true)
  }

  const handleOpenAdd = () => {
    setName('')
    setRole('Rescuer')
    setPhone('')
    setEmail('')
    setStatus('Available')
    setShelterId(store.shelters[0]?.id || '')
    setSkills('Canine Handling, Field Trapping, First Aid')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error('Name and Email are required.')
      return
    }

    store.addRescuer({
      name,
      role,
      phone,
      email,
      shelter_id: shelterId || null,
      status,
      availability: (status === 'Off Duty' ? 'On Leave' : status === 'Available' ? 'Available' : 'Busy') as any,
      skills: skills || 'General Rescue Skills',
    })

    setIsAddOpen(false)
    toast.success(`Personnel profile '${name}' added to operations roster.`)
  }

  const handleOpenEdit = (r: Rescuer) => {
    setSelectedPersonnel(r)
    setName(r.name)
    setRole(r.role || 'Rescuer')
    setPhone(r.phone)
    setEmail(r.email)
    setStatus(r.status || 'Available')
    setShelterId(r.shelter_id || '')
    setSkills(r.skills || '')
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPersonnel) return

    store.updateRescuer(selectedPersonnel.id, {
      name,
      role,
      phone,
      email,
      status,
      shelter_id: shelterId || null,
      skills,
      availability: (status === 'Off Duty' ? 'On Leave' : status === 'Available' ? 'Available' : 'Busy') as any,
    })

    setIsEditOpen(false)
    toast.success(`Personnel record for '${name}' updated.`)
  }

  const handleOpenDelete = (r: Rescuer) => {
    setSelectedPersonnel(r)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPersonnel) return
    const err = await store.deleteRescuer(selectedPersonnel.id)
    if (err) {
      toast.error(err)
    } else {
      toast.success(`Personnel profile '${selectedPersonnel.name}' removed from roster.`)
    }
    setIsDeleteOpen(false)
  }

  // Calculated Summary Statistics
  const totalPersonnel = store.rescuers.length
  const availableCount = store.rescuers.filter((r) => r.status === 'Available').length
  const onRescueCount = store.rescuers.filter((r) => r.status === 'On Rescue' || r.status === 'Responding').length
  const vetsCount = store.rescuers.filter((r) => r.role === 'Veterinarian').length
  const dispatchersCount = store.rescuers.filter((r) => r.role === 'Dispatcher').length
  const fieldRescuersCount = store.rescuers.filter((r) => r.role === 'Rescuer').length
  const offDutyCount = store.rescuers.filter((r) => r.status === 'Off Duty').length

  // Filtering Logic
  const filteredPersonnel = useMemo(() => {
    return store.rescuers.filter((r) => {
      const s = search.toLowerCase()
      const rawShelterId = (r.shelter_id || '').replace(/^sh-/, '')
      const shelter = store.shelters.find(
        (sh) => sh.id === r.shelter_id || sh.id.replace(/^sh-/, '') === rawShelterId
      )

      const matchesSearch =
        r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.phone.toLowerCase().includes(s) ||
        (r.skills && r.skills.toLowerCase().includes(s)) ||
        (shelter && shelter.name.toLowerCase().includes(s))

      const matchesRole = roleFilter === 'All' || r.role === roleFilter
      const matchesShelter =
        shelterFilter === 'All' ||
        r.shelter_id === shelterFilter ||
        (shelter && shelter.id === shelterFilter)
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter

      return matchesSearch && matchesRole && matchesShelter && matchesStatus
    })
  }, [store.rescuers, store.shelters, search, roleFilter, shelterFilter, statusFilter])

  // Helper status badge colors
  const getStatusBadge = (st: PersonnelStatusType) => {
    switch (st) {
      case 'Available':
        return (
          <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold gap-1'>
            <CheckCircle2 className='h-3 w-3' /> Available
          </Badge>
        )
      case 'Responding':
      case 'On Rescue':
        return (
          <Badge className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold gap-1 animate-pulse'>
            <AlertCircle className='h-3 w-3' /> On Rescue
          </Badge>
        )
      case 'Treating Animal':
        return (
          <Badge className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold gap-1'>
            <Stethoscope className='h-3 w-3' /> Treating
          </Badge>
        )
      case 'Off Duty':
      default:
        return (
          <Badge variant='outline' className='text-muted-foreground gap-1 font-medium'>
            <Clock className='h-3 w-3' /> Off Duty
          </Badge>
        )
    }
  }

  // Helper role badge
  const getRoleBadge = (rl?: PersonnelRoleType) => {
    switch (rl) {
      case 'Admin':
        return <Badge className='bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'>Admin</Badge>
      case 'Dispatcher':
        return <Badge className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'>Dispatcher</Badge>
      case 'Veterinarian':
        return <Badge className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'>Veterinarian</Badge>
      case 'Shelter Staff':
        return <Badge className='bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'>Shelter Staff</Badge>
      case 'Rescuer':
      default:
        return <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'>Field Rescuer</Badge>
    }
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6 max-w-[1600px] mx-auto'>
      {/* Module Title Header & Add Personnel Action */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b'>
        <div>
          <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
            🛡️ Rescue Operations Personnel Roster
          </h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Operations center managing field rescuers, clinic veterinarians, dispatchers, and shelter personnel assignments.
          </p>
        </div>

        {(userRole === 'Admin' || userRole === 'Dispatcher') && (
          <Button onClick={handleOpenAdd} size='sm' className='flex gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white'>
            <Plus className='h-4 w-4' /> Add Personnel Profile
          </Button>
        )}
      </div>

      {/* Summary Statistics Header Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Total Personnel</p>
              <p className='text-xl font-bold text-foreground'>{totalPersonnel}</p>
            </div>
            <Users className='h-5 w-5 text-muted-foreground' />
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Available</p>
              <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>{availableCount}</p>
            </div>
            <CheckCircle2 className='h-5 w-5 text-emerald-500' />
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>On Rescue</p>
              <p className='text-xl font-bold text-amber-600 dark:text-amber-400'>{onRescueCount}</p>
            </div>
            <AlertCircle className='h-5 w-5 text-amber-500' />
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Veterinarians</p>
              <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>{vetsCount}</p>
            </div>
            <Stethoscope className='h-5 w-5 text-blue-500' />
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Dispatchers</p>
              <p className='text-xl font-bold text-amber-600 dark:text-amber-400'>{dispatchersCount}</p>
            </div>
            <Radio className='h-5 w-5 text-amber-500' />
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Field Rescuers</p>
              <p className='text-xl font-bold text-teal-600 dark:text-teal-400'>{fieldRescuersCount}</p>
            </div>
            <ShieldAlert className='h-5 w-5 text-teal-500' />
          </CardContent>
        </Card>

        <Card className='border bg-card shadow-sm'>
          <CardContent className='p-3 flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Off Duty</p>
              <p className='text-xl font-bold text-muted-foreground'>{offDutyCount}</p>
            </div>
            <Clock className='h-5 w-5 text-muted-foreground' />
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm'>
        {/* Search Bar */}
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground shrink-0' />
          <Input
            placeholder='Search name, email, phone, or skills...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 text-xs'
          />
        </div>

        {/* Filter Dropdowns */}
        <div className='flex items-center gap-2 flex-wrap ml-auto text-xs'>
          <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Roles</option>
            <option value='Rescuer'>Field Rescuer</option>
            <option value='Veterinarian'>Veterinarian</option>
            <option value='Dispatcher'>Dispatcher</option>
            <option value='Shelter Staff'>Shelter Staff</option>
            <option value='Admin'>Administrator</option>
          </select>

          {/* Shelter Filter */}
          <select
            value={shelterFilter}
            onChange={(e) => setShelterFilter(e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Shelters</option>
            {store.shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Statuses</option>
            <option value='Available'>Available</option>
            <option value='On Rescue'>On Rescue</option>
            <option value='Treating Animal'>Treating Patient</option>
            <option value='Off Duty'>Off Duty</option>
          </select>
        </div>
      </div>

      {/* Personnel Roster Table */}
      <div className='rounded-xl border bg-card overflow-hidden shadow-sm'>
        <Table>
          <TableHeader className='bg-muted/20'>
            <TableRow>
              <TableHead>Personnel Name & Role</TableHead>
              <TableHead>📍 Assigned Shelter</TableHead>
              <TableHead>🛡️ Operational Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active Rescue Assignment</TableHead>
              <TableHead>Contact Directory</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPersonnel.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                  No personnel profiles match your search or filter options.
                </TableCell>
              </TableRow>
            ) : (
              filteredPersonnel.map((r) => {
                const rawShelterId = (r.shelter_id || '').replace(/^sh-/, '')
                const shelter = store.shelters.find(
                  (s) => s.id === r.shelter_id || s.id.replace(/^sh-/, '') === rawShelterId
                )

                const rawAgentId = (r.id || '').replace(/^res-/, '')
                const activeCase = store.cases.find((c) => {
                  const rawRescuerId = (c.rescuer_id || '').replace(/^res-/, '')
                  return (c.rescuer_id === r.id || rawRescuerId === rawAgentId) && c.status !== 'CLOSED'
                })

                const rawTeamId = (r.team_id || '').replace(/^team-/, '')
                const teamName =
                  r.role === 'Veterinarian'
                    ? 'Medical Care Team'
                    : r.role === 'Dispatcher'
                    ? 'Dispatch Operations Center'
                    : rawTeamId === '1'
                    ? 'Rescue Team Alpha'
                    : 'Field Unit Bravo'

                return (
                  <TableRow
                    key={r.id}
                    className='hover:bg-muted/30 cursor-pointer transition-colors'
                    onClick={() => handleOpenDrawer(r)}
                  >
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='h-9 w-9 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0'>
                          {r.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className='space-y-0.5'>
                          <div className='font-bold text-foreground hover:text-emerald-600 transition-colors flex items-center gap-1.5'>
                            {r.name}
                          </div>
                          <div className='flex items-center gap-1'>{getRoleBadge(r.role)}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className='text-xs'>
                      <span className='font-medium text-foreground flex items-center gap-1.5'>
                        <Building2 className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                        {shelter ? shelter.name : 'HQ Operations Center'}
                      </span>
                    </TableCell>

                    <TableCell className='text-xs'>
                      <span className='font-medium text-foreground flex items-center gap-1.5'>
                        <Users className='h-3.5 w-3.5 text-blue-500 shrink-0' />
                        {teamName}
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(r.status || 'Available')}</TableCell>

                    <TableCell>
                      {activeCase ? (
                        <div className='space-y-0.5'>
                          <span className='font-mono text-xs font-bold text-amber-600 dark:text-amber-400 block'>
                            {activeCase.case_number}
                          </span>
                          <span className='text-[10px] text-muted-foreground block truncate max-w-[150px]'>
                            📍 {activeCase.location}
                          </span>
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground italic'>None (Available)</span>
                      )}
                    </TableCell>

                    <TableCell className='text-xs'>
                      <div className='space-y-0.5'>
                        <div className='font-mono font-medium text-foreground'>{r.phone}</div>
                        <div className='text-[11px] text-muted-foreground font-mono truncate max-w-[160px]'>{r.email}</div>
                      </div>
                    </TableCell>

                    <TableCell className='text-right' onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                          onClick={() => handleOpenDrawer(r)}
                          title='View Profile Drawer'
                        >
                          <Eye className='h-3.5 w-3.5' />
                        </Button>
                        {(userRole === 'Admin' || userRole === 'Dispatcher') && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground'
                            onClick={() => handleOpenEdit(r)}
                            title='Edit Record'
                          >
                            <Edit2 className='h-3.5 w-3.5' />
                          </Button>
                        )}
                        {userRole === 'Admin' && (
                          <>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-amber-500 hover:bg-amber-500/10'
                              onClick={() => handleResetPassword(r)}
                              title='Reset User Password'
                            >
                              <ShieldAlert className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-rose-500 hover:bg-rose-500/10'
                              onClick={() => handleOpenDelete(r)}
                              title='Delete Profile'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </>
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

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add Personnel Profile</DialogTitle>
              <DialogDescription>Register a new operations personnel into the roster.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Full Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Marcus Wright' required />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PersonnelRoleType)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Rescuer'>Field Rescuer</option>
                    <option value='Veterinarian'>Veterinarian</option>
                    <option value='Dispatcher'>Dispatcher</option>
                    <option value='Shelter Staff'>Shelter Staff</option>
                    <option value='Admin'>Administrator</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Phone Number</span>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='555-0155' />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Email Address</span>
                  <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='marcus@rescuehub.org' required />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Assigned Shelter</span>
                  <select
                    value={shelterId}
                    onChange={(e) => setShelterId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    {store.shelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PersonnelStatusType)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Available'>Available</option>
                    <option value='On Rescue'>On Rescue</option>
                    <option value='Treating Animal'>Treating Patient</option>
                    <option value='Off Duty'>Off Duty</option>
                  </select>
                </div>
              </div>

              <div className='space-y-1 bg-blue-500/10 p-3 rounded-xl border border-blue-500/30 text-xs'>
                <span className='font-bold text-blue-700 dark:text-blue-300 block'>
                  🔐 Automatic System Account Provisioning
                </span>
                <p className='text-muted-foreground leading-relaxed'>
                  Creating this profile automatically provisions a system user account. The personnel can immediately log in using their email and default password <code className='font-mono font-bold bg-muted px-1 py-0.5 rounded text-foreground'>agent123</code>.
                </p>
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Skills & Specializations</span>
                <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder='Canine Trapping, Emergency First Aid' />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Register Personnel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedPersonnel && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Personnel Profile</DialogTitle>
                <DialogDescription>Modify status or operational details for {selectedPersonnel.name}.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Full Name</span>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Role</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as PersonnelRoleType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Rescuer'>Field Rescuer</option>
                      <option value='Veterinarian'>Veterinarian</option>
                      <option value='Dispatcher'>Dispatcher</option>
                      <option value='Shelter Staff'>Shelter Staff</option>
                      <option value='Admin'>Administrator</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Phone Number</span>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Email Address</span>
                    <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Assigned Shelter</span>
                    <select
                      value={shelterId}
                      onChange={(e) => setShelterId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      {store.shelters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PersonnelStatusType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Available'>Available</option>
                      <option value='On Rescue'>On Rescue</option>
                      <option value='Treating Animal'>Treating Patient</option>
                      <option value='Off Duty'>Off Duty</option>
                    </select>
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Skills & Qualifications</span>
                  <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
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
            <DialogTitle>Delete Personnel Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this profile from the operations roster?
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

      {/* Admin Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className='max-w-md w-full'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600'>
              <ShieldAlert className='h-5 w-5' /> Admin Security Override
            </DialogTitle>
            <DialogDescription>
              Password has been reset for <strong className='text-foreground'>{selectedPersonnel?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className='p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs'>
            <p className='text-muted-foreground'>
              Please share the following temporary security credential with the user. They will be forced to choose a new password upon their next login.
            </p>
            <div className='flex items-center justify-between bg-background p-2.5 rounded border font-mono font-bold text-sm text-foreground select-all'>
              <span>{tempPassword}</span>
              <Badge className='bg-amber-500 text-slate-950 font-bold'>Temporary</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button className='bg-amber-600 hover:bg-amber-700 text-white font-bold' onClick={() => setIsResetOpen(false)}>
              Acknowledge & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Personnel Detail Drawer */}
      <PersonnelDetailDrawer
        rescuer={selectedPersonnel}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}
