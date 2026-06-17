import { useState } from 'react'
import { useRescueHubStore, type Treatment } from '@/stores/rescue-hub-store'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'

export function Treatments() {
  const store = useRescueHubStore()
  const [search, setSearch] = useState('')

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)

  // Form States
  const [animalId, setAnimalId] = useState('')
  const [date, setDate] = useState('')
  const [veterinarian, setVeterinarian] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medication, setMedication] = useState('')
  const [procedure, setProcedure] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')

  // Handlers
  const handleOpenAdd = () => {
    setAnimalId(store.animals[0]?.id || '')
    setDate(new Date().toISOString().substring(0, 16)) // datetime-local format
    setVeterinarian('')
    setDiagnosis('')
    setMedication('')
    setProcedure('')
    setFollowUpDate('')
    setNotes('')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!animalId || !veterinarian || !diagnosis) {
      toast.error('Animal, Veterinarian, and Diagnosis are required.')
      return
    }

    store.addTreatment({
      animal_id: animalId,
      date: new Date(date).toISOString(),
      veterinarian,
      diagnosis,
      medication: medication || 'None',
      procedure: procedure || 'None',
      follow_up_date: followUpDate || null,
      notes
    })

    setIsAddOpen(false)
    toast.success('Medical treatment logged successfully.')
  }

  const handleOpenEdit = (t: Treatment) => {
    setSelectedTreatment(t)
    setAnimalId(t.animal_id)
    // format to YYYY-MM-DDTHH:MM for datetime-local
    const formattedDate = new Date(t.date).toISOString().substring(0, 16)
    setDate(formattedDate)
    setVeterinarian(t.veterinarian)
    setDiagnosis(t.diagnosis)
    setMedication(t.medication)
    setProcedure(t.procedure)
    setFollowUpDate(t.follow_up_date || '')
    setNotes(t.notes)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTreatment) return

    store.updateTreatment(selectedTreatment.id, {
      animal_id: animalId,
      date: new Date(date).toISOString(),
      veterinarian,
      diagnosis,
      medication,
      procedure,
      follow_up_date: followUpDate || null,
      notes
    })

    setIsEditOpen(false)
    toast.success('Treatment record updated.')
  }

  const handleOpenDelete = (t: Treatment) => {
    setSelectedTreatment(t)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedTreatment) return
    store.deleteTreatment(selectedTreatment.id)
    setIsDeleteOpen(false)
    toast.success('Treatment record deleted.')
  }

  // Filters
  const filteredTreatments = store.treatments.filter((t) => {
    const animal = store.animals.find((a) => a.id === t.animal_id)
    const animalName = animal ? animal.name : ''
    return (
      veterinarian.toLowerCase().includes(search.toLowerCase()) ||
      diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      medication.toLowerCase().includes(search.toLowerCase()) ||
      procedure.toLowerCase().includes(search.toLowerCase()) ||
      animalName.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Medical Treatments</h2>
          <p className='text-muted-foreground'>
            Log and review veterinary diagnostics, operations, medications, and schedule check-up dates.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className='flex gap-2'>
          <Plus className='h-4 w-4' /> Record Treatment
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-4 py-4 bg-muted/20 p-4 rounded-lg border'>
        <div className='flex items-center gap-2 max-w-sm w-full'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search animal name, vet, diagnosis, medication...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9'
          />
        </div>
      </div>

      {/* Treatments Table */}
      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Animal</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Veterinarian</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Procedure</TableHead>
              <TableHead>Follow Up</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTreatments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                  No medical treatment records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTreatments.map((t) => {
                const animal = store.animals.find((a) => a.id === t.animal_id)

                return (
                  <TableRow key={t.id}>
                    <TableCell className='font-semibold'>{animal ? animal.name : 'Unknown'}</TableCell>
                    <TableCell>{new Date(t.date).toLocaleString()}</TableCell>
                    <TableCell>{t.veterinarian}</TableCell>
                    <TableCell className='font-medium text-rose-500'>{t.diagnosis}</TableCell>
                    <TableCell>{t.medication}</TableCell>
                    <TableCell>{t.procedure}</TableCell>
                    <TableCell>
                      {t.follow_up_date ? (
                        <span className='text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-1 rounded border border-amber-500/20'>
                          {t.follow_up_date}
                        </span>
                      ) : (
                        <span className='text-muted-foreground text-xs'>None</span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground'
                          onClick={() => handleOpenEdit(t)}
                        >
                          <Edit2 className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                          onClick={() => handleOpenDelete(t)}
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
              <DialogTitle>Record Treatment Entry</DialogTitle>
              <DialogDescription>Log medical details, medication, and scheduler details.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4 h-105 overflow-y-auto pr-2'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Select Animal</span>
                  <select
                    value={animalId}
                    onChange={(e) => setAnimalId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    required
                  >
                    {store.animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.species} - {a.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Treatment Date</span>
                  <Input type='datetime-local' value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Veterinarian Name</span>
                  <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder='Dr. Alice Vance' required />
                </div>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Follow Up Check Date</span>
                  <Input type='date' value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Medical Diagnosis</span>
                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder='e.g., Canine Parvovirus, Starvation' required />
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Prescribed Medication</span>
                <Input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder='e.g., Amoxicillin 250mg, Pain relief drops' />
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Procedure Performed</span>
                <Input value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder='e.g., Splinting leg, IV drip setup' />
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Medical Notes</span>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Enter detailed symptoms, behavioral observations, recovery plans...' />
              </div>
            </div>
            <DialogFooter className='pt-2'>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Log Medical Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-lg'>
          {selectedTreatment && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Medical Record</DialogTitle>
                <DialogDescription>Modify diagnostics parameters or treatment notes.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4 h-105 overflow-y-auto pr-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Select Animal</span>
                    <select
                      value={animalId}
                      onChange={(e) => setAnimalId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                      required
                    >
                      {store.animals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.species})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Treatment Date</span>
                    <Input type='datetime-local' value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Veterinarian Name</span>
                    <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} required />
                  </div>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Follow Up Check Date</span>
                    <Input type='date' value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Medical Diagnosis</span>
                  <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Prescribed Medication</span>
                  <Input value={medication} onChange={(e) => setMedication(e.target.value)} />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Procedure Performed</span>
                  <Input value={procedure} onChange={(e) => setProcedure(e.target.value)} />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Medical Notes</span>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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
            <DialogTitle>Delete Medical Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this treatment record? This cannot be undone.
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
