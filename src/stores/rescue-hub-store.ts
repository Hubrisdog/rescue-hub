import { create } from 'zustand'

export type SeverityType = 'Low' | 'Medium' | 'High' | 'Critical'

export type IncidentStatusType = 'Pending' | 'Approved' | 'Rejected'

export type RescueCaseStatusType =
  | 'REPORTED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'RESCUED'
  | 'SHELTER_INTAKE'
  | 'UNDER_TREATMENT'
  | 'RECOVERED'
  | 'ADOPTED'
  | 'RELEASED'
  | 'CLOSED'

export type AnimalStatusType =
  | 'Intake'
  | 'Under Treatment'
  | 'Recovered'
  | 'Adopted'
  | 'Released'

export type RescuerAvailabilityType = 'Available' | 'Busy' | 'On Leave'

export interface IncidentReport {
  id: string
  reporter_name: string
  report_date: string
  location: string
  description: string
  severity: SeverityType
  status: IncidentStatusType
  created_at: string
}

export interface RescueCase {
  id: string
  incident_id: string | null
  case_number: string
  report_date: string
  rescue_date: string | null
  location: string
  description: string
  severity: SeverityType
  status: RescueCaseStatusType
  rescuer_id: string | null
  shelter_id: string | null
  animal_id: string | null
  notes: string
  created_at: string
}

export interface Animal {
  id: string
  name: string
  species: string
  breed: string
  sex: string
  estimated_age: string
  weight: number
  color: string
  condition: string
  status: AnimalStatusType
  photo_url: string | null
  shelter_id: string | null
  case_id: string | null
  created_at: string
}

export interface Rescuer {
  id: string
  name: string
  phone: string
  email: string
  skills: string
  availability: RescuerAvailabilityType
  created_at: string
}

export interface Shelter {
  id: string
  name: string
  address: string
  contact_person: string
  capacity: number
  created_at: string
}

export interface Treatment {
  id: string
  animal_id: string
  date: string
  veterinarian: string
  diagnosis: string
  medication: string
  procedure: string
  follow_up_date: string | null
  notes: string
  created_at: string
}

export interface ActivityLog {
  id: string
  entity_type: 'IncidentReport' | 'RescueCase' | 'Animal' | 'Rescuer' | 'Shelter' | 'Treatment'
  entity_id: string
  action: string
  timestamp: string
  user: string
}

interface RescueHubState {
  incidents: IncidentReport[]
  cases: RescueCase[]
  animals: Animal[]
  rescuers: Rescuer[]
  shelters: Shelter[]
  treatments: Treatment[]
  activityLogs: ActivityLog[]

  // Incidents CRUD
  addIncident: (incident: Omit<IncidentReport, 'id' | 'created_at'>) => void
  updateIncident: (id: string, incident: Partial<IncidentReport>) => void
  deleteIncident: (id: string) => void
  promoteIncidentToCase: (id: string, rescuerId?: string, shelterId?: string) => void

  // Cases CRUD
  addCase: (rescueCase: Omit<RescueCase, 'id' | 'created_at' | 'case_number'>) => void
  updateCase: (id: string, rescueCase: Partial<RescueCase>) => string | null // returns error msg if invalid transition
  deleteCase: (id: string) => void

  // Animals CRUD
  addAnimal: (animal: Omit<Animal, 'id' | 'created_at'>) => void
  updateAnimal: (id: string, animal: Partial<Animal>) => void
  deleteAnimal: (id: string) => void

  // Rescuers CRUD
  addRescuer: (rescuer: Omit<Rescuer, 'id' | 'created_at'>) => void
  updateRescuer: (id: string, rescuer: Partial<Rescuer>) => void
  deleteRescuer: (id: string) => void

  // Shelters CRUD
  addShelter: (shelter: Omit<Shelter, 'id' | 'created_at'>) => void
  updateShelter: (id: string, shelter: Partial<Shelter>) => void
  deleteShelter: (id: string) => void

  // Treatments CRUD
  addTreatment: (treatment: Omit<Treatment, 'id' | 'created_at'>) => void
  updateTreatment: (id: string, treatment: Partial<Treatment>) => void
  deleteTreatment: (id: string) => void
}

// Validation rules
export const VALID_CASE_TRANSITIONS: Record<RescueCaseStatusType, RescueCaseStatusType[]> = {
  REPORTED: ['ASSIGNED', 'CLOSED'],
  ASSIGNED: ['REPORTED', 'EN_ROUTE', 'CLOSED'],
  EN_ROUTE: ['ASSIGNED', 'RESCUED', 'CLOSED'],
  RESCUED: ['SHELTER_INTAKE', 'CLOSED'],
  SHELTER_INTAKE: ['UNDER_TREATMENT', 'RECOVERED', 'CLOSED'],
  UNDER_TREATMENT: ['RECOVERED', 'CLOSED'],
  RECOVERED: ['ADOPTED', 'RELEASED', 'CLOSED'],
  ADOPTED: ['CLOSED'],
  RELEASED: ['CLOSED'],
  CLOSED: []
}

// Initial mock datasets
const mockIncidents: IncidentReport[] = [
  {
    id: 'inc-1',
    reporter_name: 'John Smith',
    report_date: '2026-06-16T10:00:00Z',
    location: '12 Maple St, Riverside',
    description: 'Stray kitten stuck inside a stormwater drain. Meowing loudly.',
    severity: 'Medium',
    status: 'Approved',
    created_at: '2026-06-16T10:00:00Z'
  },
  {
    id: 'inc-2',
    reporter_name: 'Alice Cooper',
    report_date: '2026-06-17T08:30:00Z',
    location: 'Highway 101, Mile Marker 45',
    description: 'Dog seen running along the median. Looks scared and exhausted.',
    severity: 'Critical',
    status: 'Approved',
    created_at: '2026-06-17T08:30:00Z'
  },
  {
    id: 'inc-3',
    reporter_name: 'Robert Downy',
    report_date: '2026-06-17T15:45:00Z',
    location: 'Central Park, Pond Area',
    description: 'Geese with plastic ring caught around its neck. Struggling to eat.',
    severity: 'Low',
    status: 'Pending',
    created_at: '2026-06-17T15:45:00Z'
  }
]

const mockRescuers: Rescuer[] = [
  {
    id: 'res-1',
    name: 'Mark Davis',
    phone: '555-0199',
    email: 'mark.davis@rescuehub.org',
    skills: 'Canine Handling, First Aid, Swiftwater Rescue',
    availability: 'Available',
    created_at: '2026-06-10T12:00:00Z'
  },
  {
    id: 'res-2',
    name: 'Linda Jones',
    phone: '555-0188',
    email: 'linda.jones@rescuehub.org',
    skills: 'Feline Behavior, Wildlife Rehab, Trapping',
    availability: 'Busy',
    created_at: '2026-06-11T09:00:00Z'
  },
  {
    id: 'res-3',
    name: 'Robert Chen',
    phone: '555-0177',
    email: 'robert.chen@rescuehub.org',
    skills: 'Large Animal Rescue, Animal Transport',
    availability: 'Available',
    created_at: '2026-06-12T14:00:00Z'
  },
  {
    id: 'res-4',
    name: 'Emily Watson',
    phone: '555-0166',
    email: 'emily.watson@rescuehub.org',
    skills: 'Avian Care, Trapping, First Aid',
    availability: 'On Leave',
    created_at: '2026-06-13T10:00:00Z'
  }
]

const mockShelters: Shelter[] = [
  {
    id: 'sh-1',
    name: 'Green Valley Sanctuary',
    address: '124 Forest Rd, Green Valley',
    contact_person: 'Sarah Connor',
    capacity: 25,
    created_at: '2026-06-10T08:00:00Z'
  },
  {
    id: 'sh-2',
    name: 'Safe Haven Shelter',
    address: '789 Oak Ave, Riverdale',
    contact_person: 'David Miller',
    capacity: 15,
    created_at: '2026-06-11T08:00:00Z'
  },
  {
    id: 'sh-3',
    name: 'Northside Animal Refuge',
    address: '456 Pines Hwy, Northport',
    contact_person: 'Jessica Taylor',
    capacity: 10,
    created_at: '2026-06-12T08:00:00Z'
  }
]

const mockAnimals: Animal[] = [
  {
    id: 'ani-1',
    name: 'Bella',
    species: 'Dog',
    breed: 'Golden Retriever Mix',
    sex: 'Female',
    estimated_age: '2 years',
    weight: 22.5,
    color: 'Golden',
    condition: 'Malnourished, minor lacerations',
    status: 'Under Treatment',
    photo_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop',
    shelter_id: 'sh-1',
    case_id: 'case-2',
    created_at: '2026-06-17T09:30:00Z'
  },
  {
    id: 'ani-2',
    name: 'Milo',
    species: 'Cat',
    breed: 'Domestic Shorthair',
    sex: 'Male',
    estimated_age: '6 months',
    weight: 3.2,
    color: 'Tabby (grey/black)',
    condition: 'Dehydrated, respiratory infection',
    status: 'Under Treatment',
    photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    shelter_id: 'sh-2',
    case_id: 'case-1',
    created_at: '2026-06-16T11:30:00Z'
  },
  {
    id: 'ani-3',
    name: 'Rocky',
    species: 'Dog',
    breed: 'Boxer Mix',
    sex: 'Male',
    estimated_age: '4 years',
    weight: 28.0,
    color: 'Fawn with white chest',
    condition: 'Recovered and active',
    status: 'Recovered',
    photo_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop',
    shelter_id: 'sh-1',
    case_id: null,
    created_at: '2026-06-14T09:00:00Z'
  }
]

const mockCases: RescueCase[] = [
  {
    id: 'case-1',
    incident_id: 'inc-1',
    case_number: 'RC-2026-0001',
    report_date: '2026-06-16T10:00:00Z',
    rescue_date: '2026-06-16T11:30:00Z',
    location: '12 Maple St, Riverside',
    description: 'Stray kitten stuck inside a stormwater drain. Meowing loudly.',
    severity: 'Medium',
    status: 'UNDER_TREATMENT',
    rescuer_id: 'res-2',
    shelter_id: 'sh-2',
    animal_id: 'ani-2',
    notes: 'Kitten was shivering and wet. Transferred to Safe Haven.',
    created_at: '2026-06-16T10:15:00Z'
  },
  {
    id: 'case-2',
    incident_id: 'inc-2',
    case_number: 'RC-2026-0002',
    report_date: '2026-06-17T08:30:00Z',
    rescue_date: '2026-06-17T09:15:00Z',
    location: 'Highway 101, Mile Marker 45',
    description: 'Dog seen running along the median. Looks scared and exhausted.',
    severity: 'Critical',
    status: 'UNDER_TREATMENT',
    rescuer_id: 'res-1',
    shelter_id: 'sh-1',
    animal_id: 'ani-1',
    notes: 'Friendly dog, easily lured with treats. Dehydrated.',
    created_at: '2026-06-17T08:45:00Z'
  }
]

const mockTreatments: Treatment[] = [
  {
    id: 'treat-1',
    animal_id: 'ani-1',
    date: '2026-06-17T11:00:00Z',
    veterinarian: 'Dr. Alice Vance',
    diagnosis: 'Severe dehydration and minor cuts',
    medication: 'Clavamox, subcutaneous fluids',
    procedure: 'Wound disinfection, IV fluid hydration',
    follow_up_date: '2026-06-24',
    notes: 'Monitor diet closely. Dog needs high-calorie intake.',
    created_at: '2026-06-17T11:00:00Z'
  },
  {
    id: 'treat-2',
    animal_id: 'ani-2',
    date: '2026-06-16T14:00:00Z',
    veterinarian: 'Dr. Alice Vance',
    diagnosis: 'Upper respiratory infection',
    medication: 'L-Lysine, Clavamox drops',
    procedure: 'Basic checkup, cleaning nasal passages',
    follow_up_date: '2026-06-23',
    notes: 'Keep in warm isolation room.',
    created_at: '2026-06-16T14:00:00Z'
  }
]

const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    entity_type: 'IncidentReport',
    entity_id: 'inc-1',
    action: 'Incident report submitted by John Smith',
    timestamp: '2026-06-16T10:00:00Z',
    user: 'Citizen Reporter'
  },
  {
    id: 'log-2',
    entity_type: 'RescueCase',
    entity_id: 'case-1',
    action: 'Rescue Case RC-2026-0001 created from Incident Report inc-1',
    timestamp: '2026-06-16T10:15:00Z',
    user: 'Dispatcher'
  },
  {
    id: 'log-3',
    entity_type: 'RescueCase',
    entity_id: 'case-1',
    action: 'Case status updated to ASSIGNED. Rescuer Linda Jones assigned',
    timestamp: '2026-06-16T10:20:00Z',
    user: 'Dispatcher'
  },
  {
    id: 'log-4',
    entity_type: 'RescueCase',
    entity_id: 'case-1',
    action: 'Case status updated to EN_ROUTE',
    timestamp: '2026-06-16T10:30:00Z',
    user: 'Linda Jones'
  },
  {
    id: 'log-5',
    entity_type: 'RescueCase',
    entity_id: 'case-1',
    action: 'Case status updated to RESCUED. Animal Milo retrieved',
    timestamp: '2026-06-16T11:30:00Z',
    user: 'Linda Jones'
  },
  {
    id: 'log-6',
    entity_type: 'RescueCase',
    entity_id: 'case-1',
    action: 'Case status updated to SHELTER_INTAKE. Checked in at Safe Haven Shelter',
    timestamp: '2026-06-16T12:00:00Z',
    user: 'Safe Haven Staff'
  },
  {
    id: 'log-7',
    entity_type: 'RescueCase',
    entity_id: 'case-1',
    action: 'Case status updated to UNDER_TREATMENT',
    timestamp: '2026-06-16T12:30:00Z',
    user: 'Veterinarian'
  },
  {
    id: 'log-8',
    entity_type: 'Treatment',
    entity_id: 'treat-2',
    action: 'Treatment recorded for Milo: Upper respiratory infection diagnosis',
    timestamp: '2026-06-16T14:00:00Z',
    user: 'Dr. Alice Vance'
  },
  {
    id: 'log-9',
    entity_type: 'IncidentReport',
    entity_id: 'inc-2',
    action: 'Incident report submitted by Alice Cooper',
    timestamp: '2026-06-17T08:30:00Z',
    user: 'Citizen Reporter'
  },
  {
    id: 'log-10',
    entity_type: 'RescueCase',
    entity_id: 'case-2',
    action: 'Rescue Case RC-2026-0002 created from Incident Report inc-2',
    timestamp: '2026-06-17T08:45:00Z',
    user: 'Dispatcher'
  },
  {
    id: 'log-11',
    entity_type: 'RescueCase',
    entity_id: 'case-2',
    action: 'Case status updated to UNDER_TREATMENT. Rescuer Mark Davis assigned. Animal Bella registered.',
    timestamp: '2026-06-17T09:30:00Z',
    user: 'Dispatcher'
  },
  {
    id: 'log-12',
    entity_type: 'Treatment',
    entity_id: 'treat-1',
    action: 'Treatment recorded for Bella: Severe dehydration and minor cuts',
    timestamp: '2026-06-17T11:00:00Z',
    user: 'Dr. Alice Vance'
  }
]

// Generate a random UUID helper
const generateUUID = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Get database state from localStorage
const getLocalStorageDB = () => {
  const data = localStorage.getItem('rescue_hub_db')
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  return null
}

interface RescueHubDB {
  incidents: IncidentReport[]
  cases: RescueCase[]
  animals: Animal[]
  rescuers: Rescuer[]
  shelters: Shelter[]
  treatments: Treatment[]
  activityLogs: ActivityLog[]
}

const saveLocalStorageDB = (state: RescueHubDB) => {
  localStorage.setItem(
    'rescue_hub_db',
    JSON.stringify({
      incidents: state.incidents,
      cases: state.cases,
      animals: state.animals,
      rescuers: state.rescuers,
      shelters: state.shelters,
      treatments: state.treatments,
      activityLogs: state.activityLogs
    })
  )
}

const loadedDB = getLocalStorageDB()

export const useRescueHubStore = create<RescueHubState>()((set, get) => ({
  incidents: loadedDB?.incidents || mockIncidents,
  cases: loadedDB?.cases || mockCases,
  animals: loadedDB?.animals || mockAnimals,
  rescuers: loadedDB?.rescuers || mockRescuers,
  shelters: loadedDB?.shelters || mockShelters,
  treatments: loadedDB?.treatments || mockTreatments,
  activityLogs: loadedDB?.activityLogs || mockActivityLogs,

  // Incidents CRUD
  addIncident: (incident) => {
    const newIncident: IncidentReport = {
      ...incident,
      id: 'inc-' + generateUUID(),
      created_at: new Date().toISOString()
    }
    set((state) => {
      const updated = {
        ...state,
        incidents: [newIncident, ...state.incidents],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'IncidentReport',
            entity_id: newIncident.id,
            action: `Incident report submitted by ${newIncident.reporter_name}`,
            timestamp: new Date().toISOString(),
            user: 'Citizen Reporter'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  updateIncident: (id, data) => {
    set((state) => {
      const updatedIncidents = state.incidents.map((inc) =>
        inc.id === id ? { ...inc, ...data } : inc
      )
      const actionText = `Incident report status updated: ${data.status || 'details changed'}`
      const updated = {
        ...state,
        incidents: updatedIncidents,
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'IncidentReport',
            entity_id: id,
            action: actionText,
            timestamp: new Date().toISOString(),
            user: 'Dispatcher'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  deleteIncident: (id) => {
    set((state) => {
      const updated = {
        ...state,
        incidents: state.incidents.filter((inc) => inc.id !== id),
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'IncidentReport',
            entity_id: id,
            action: `Incident report removed`,
            timestamp: new Date().toISOString(),
            user: 'Dispatcher'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  promoteIncidentToCase: (id, rescuerId, shelterId) => {
    const state = get()
    const incident = state.incidents.find((inc) => inc.id === id)
    if (!incident) return

    // 1. Create unique case number
    const caseIndex = state.cases.length + 1
    const caseNum = `RC-2026-${caseIndex.toString().padStart(4, '0')}`

    // 2. Setup initial case details
    const newCaseId = 'case-' + generateUUID()
    const newAnimalId = 'ani-' + generateUUID()

    const newAnimal: Animal = {
      id: newAnimalId,
      name: 'Unnamed Animal',
      species: incident.description.toLowerCase().includes('dog') ? 'Dog' : incident.description.toLowerCase().includes('cat') ? 'Cat' : incident.description.toLowerCase().includes('bird') ? 'Bird' : 'Other',
      breed: 'Unknown Mix',
      sex: 'Unknown',
      estimated_age: 'Unknown',
      weight: 0,
      color: 'Unknown',
      condition: incident.description,
      status: 'Intake',
      photo_url: null,
      shelter_id: shelterId || null,
      case_id: newCaseId,
      created_at: new Date().toISOString()
    }

    const newCase: RescueCase = {
      id: newCaseId,
      incident_id: id,
      case_number: caseNum,
      report_date: incident.report_date,
      rescue_date: null,
      location: incident.location,
      description: incident.description,
      severity: incident.severity,
      status: rescuerId ? 'ASSIGNED' : 'REPORTED',
      rescuer_id: rescuerId || null,
      shelter_id: shelterId || null,
      animal_id: newAnimalId,
      notes: 'Promoted from Incident Report.',
      created_at: new Date().toISOString()
    }

    set((s) => {
      const updatedIncidents = s.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: 'Approved' as IncidentStatusType } : inc
      )
      const updated = {
        ...s,
        incidents: updatedIncidents,
        cases: [newCase, ...s.cases],
        animals: [newAnimal, ...s.animals],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'RescueCase',
            entity_id: newCase.id,
            action: `Rescue Case ${caseNum} approved and created from Incident Report`,
            timestamp: new Date().toISOString(),
            user: 'Dispatcher'
          } as ActivityLog,
          ...s.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  // Cases CRUD
  addCase: (caseData) => {
    const caseIndex = get().cases.length + 1
    const caseNum = `RC-2026-${caseIndex.toString().padStart(4, '0')}`
    const newCase: RescueCase = {
      ...caseData,
      id: 'case-' + generateUUID(),
      case_number: caseNum,
      created_at: new Date().toISOString()
    }

    set((state) => {
      const updated = {
        ...state,
        cases: [newCase, ...state.cases],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'RescueCase',
            entity_id: newCase.id,
            action: `Rescue Case ${caseNum} registered at ${newCase.location}`,
            timestamp: new Date().toISOString(),
            user: 'Dispatcher'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  updateCase: (id, data) => {
    const state = get()
    const currentCase = state.cases.find((c) => c.id === id)
    if (!currentCase) return 'Case not found'

    // Enforce workflow validations if status is changing
    if (data.status && data.status !== currentCase.status) {
      const allowed = VALID_CASE_TRANSITIONS[currentCase.status]
      if (!allowed.includes(data.status)) {
        return `Invalid status transition: Cannot change case from ${currentCase.status} to ${data.status}`
      }
    }

    // Prepare logs
    const logs: ActivityLog[] = []
    const timestamp = new Date().toISOString()

    if (data.status && data.status !== currentCase.status) {
      logs.push({
        id: 'log-' + generateUUID(),
        entity_type: 'RescueCase',
        entity_id: id,
        action: `Case status updated from ${currentCase.status} to ${data.status}`,
        timestamp,
        user: 'Dispatcher'
      })

      // Sync animal status when Case transitions
      if (currentCase.animal_id) {
        let animalStatus: AnimalStatusType | null = null
        if (data.status === 'SHELTER_INTAKE') animalStatus = 'Intake'
        else if (data.status === 'UNDER_TREATMENT') animalStatus = 'Under Treatment'
        else if (data.status === 'RECOVERED') animalStatus = 'Recovered'
        else if (data.status === 'ADOPTED') animalStatus = 'Adopted'
        else if (data.status === 'RELEASED') animalStatus = 'Released'

        if (animalStatus) {
          state.animals = state.animals.map((a) =>
            a.id === currentCase.animal_id ? { ...a, status: animalStatus as AnimalStatusType } : a
          )
        }
      }
    }

    if (data.rescuer_id && data.rescuer_id !== currentCase.rescuer_id) {
      const rescuer = state.rescuers.find((r) => r.id === data.rescuer_id)
      logs.push({
        id: 'log-' + generateUUID(),
        entity_type: 'RescueCase',
        entity_id: id,
        action: `Rescuer assigned: ${rescuer ? rescuer.name : 'Unknown'}`,
        timestamp,
        user: 'Dispatcher'
      })
    }

    if (data.shelter_id && data.shelter_id !== currentCase.shelter_id) {
      const shelter = state.shelters.find((s) => s.id === data.shelter_id)
      logs.push({
        id: 'log-' + generateUUID(),
        entity_type: 'RescueCase',
        entity_id: id,
        action: `Shelter assigned: ${shelter ? shelter.name : 'Unknown'}`,
        timestamp,
        user: 'Dispatcher'
      })

      // Sync animal current shelter too
      if (currentCase.animal_id) {
        state.animals = state.animals.map((a) =>
          a.id === currentCase.animal_id ? { ...a, shelter_id: data.shelter_id || null } : a
        )
      }
    }

    if (logs.length === 0) {
      logs.push({
        id: 'log-' + generateUUID(),
        entity_type: 'RescueCase',
        entity_id: id,
        action: `Case details updated`,
        timestamp,
        user: 'Dispatcher'
      })
    }

    set((s) => {
      const updatedCases = s.cases.map((c) =>
        c.id === id ? { ...c, ...data } : c
      )
      const updated = {
        ...s,
        cases: updatedCases,
        activityLogs: [...logs, ...s.activityLogs]
      }
      saveLocalStorageDB(updated)
      return updated
    })

    return null
  },

  deleteCase: (id) => {
    set((state) => {
      const updated = {
        ...state,
        cases: state.cases.filter((c) => c.id !== id),
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'RescueCase',
            entity_id: id,
            action: `Rescue Case deleted`,
            timestamp: new Date().toISOString(),
            user: 'Dispatcher'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  // Animals CRUD
  addAnimal: (animal) => {
    const newAnimal: Animal = {
      ...animal,
      id: 'ani-' + generateUUID(),
      created_at: new Date().toISOString()
    }
    set((state) => {
      const updated = {
        ...state,
        animals: [newAnimal, ...state.animals],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Animal',
            entity_id: newAnimal.id,
            action: `Animal record registered: ${newAnimal.name} (${newAnimal.species})`,
            timestamp: new Date().toISOString(),
            user: 'Dispatcher'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  updateAnimal: (id, data) => {
    set((state) => {
      const currentAnimal = state.animals.find((a) => a.id === id)
      const logs: ActivityLog[] = []
      const timestamp = new Date().toISOString()

      if (data.status && data.status !== currentAnimal?.status) {
        logs.push({
          id: 'log-' + generateUUID(),
          entity_type: 'Animal',
          entity_id: id,
          action: `Animal ${currentAnimal?.name} status changed from ${currentAnimal?.status} to ${data.status}`,
          timestamp,
          user: 'Staff'
        })
      } else {
        logs.push({
          id: 'log-' + generateUUID(),
          entity_type: 'Animal',
          entity_id: id,
          action: `Animal ${currentAnimal?.name || 'record'} details updated`,
          timestamp,
          user: 'Staff'
        })
      }

      const updatedAnimals = state.animals.map((a) =>
        a.id === id ? { ...a, ...data } : a
      )
      const updated = {
        ...state,
        animals: updatedAnimals,
        activityLogs: [...logs, ...state.activityLogs]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  deleteAnimal: (id) => {
    set((state) => {
      const updated = {
        ...state,
        animals: state.animals.filter((a) => a.id !== id),
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Animal',
            entity_id: id,
            action: `Animal record deleted`,
            timestamp: new Date().toISOString(),
            user: 'Staff'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  // Rescuers CRUD
  addRescuer: (rescuer) => {
    const newRescuer: Rescuer = {
      ...rescuer,
      id: 'res-' + generateUUID(),
      created_at: new Date().toISOString()
    }
    set((state) => {
      const updated = {
        ...state,
        rescuers: [newRescuer, ...state.rescuers],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Rescuer',
            entity_id: newRescuer.id,
            action: `New rescuer profile created: ${newRescuer.name}`,
            timestamp: new Date().toISOString(),
            user: 'Manager'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  updateRescuer: (id, data) => {
    set((state) => {
      const currentRescuer = state.rescuers.find((r) => r.id === id)
      const logs: ActivityLog[] = []
      const timestamp = new Date().toISOString()

      if (data.availability && data.availability !== currentRescuer?.availability) {
        logs.push({
          id: 'log-' + generateUUID(),
          entity_type: 'Rescuer',
          entity_id: id,
          action: `Rescuer ${currentRescuer?.name} availability changed to ${data.availability}`,
          timestamp,
          user: 'Manager'
        })
      } else {
        logs.push({
          id: 'log-' + generateUUID(),
          entity_type: 'Rescuer',
          entity_id: id,
          action: `Rescuer ${currentRescuer?.name || 'profile'} updated`,
          timestamp,
          user: 'Manager'
        })
      }

      const updatedRescuers = state.rescuers.map((r) =>
        r.id === id ? { ...r, ...data } : r
      )
      const updated = {
        ...state,
        rescuers: updatedRescuers,
        activityLogs: [...logs, ...state.activityLogs]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  deleteRescuer: (id) => {
    set((state) => {
      const updated = {
        ...state,
        rescuers: state.rescuers.filter((r) => r.id !== id),
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Rescuer',
            entity_id: id,
            action: `Rescuer profile deleted`,
            timestamp: new Date().toISOString(),
            user: 'Manager'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  // Shelters CRUD
  addShelter: (shelter) => {
    const newShelter: Shelter = {
      ...shelter,
      id: 'sh-' + generateUUID(),
      created_at: new Date().toISOString()
    }
    set((state) => {
      const updated = {
        ...state,
        shelters: [newShelter, ...state.shelters],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Shelter',
            entity_id: newShelter.id,
            action: `New shelter added: ${newShelter.name} (Capacity: ${newShelter.capacity})`,
            timestamp: new Date().toISOString(),
            user: 'Manager'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  updateShelter: (id, data) => {
    set((state) => {
      const currentShelter = state.shelters.find((s) => s.id === id)
      const updatedShelters = state.shelters.map((s) =>
        s.id === id ? { ...s, ...data } : s
      )
      const updated = {
        ...state,
        shelters: updatedShelters,
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Shelter',
            entity_id: id,
            action: `Shelter ${currentShelter?.name} information updated`,
            timestamp: new Date().toISOString(),
            user: 'Manager'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  deleteShelter: (id) => {
    set((state) => {
      const updated = {
        ...state,
        shelters: state.shelters.filter((s) => s.id !== id),
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Shelter',
            entity_id: id,
            action: `Shelter deleted`,
            timestamp: new Date().toISOString(),
            user: 'Manager'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  // Treatments CRUD
  addTreatment: (treatment) => {
    const newTreatment: Treatment = {
      ...treatment,
      id: 'treat-' + generateUUID(),
      created_at: new Date().toISOString()
    }
    set((state) => {
      const animal = state.animals.find((a) => a.id === treatment.animal_id)
      const updated = {
        ...state,
        treatments: [newTreatment, ...state.treatments],
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Treatment',
            entity_id: newTreatment.id,
            action: `Treatment logged for ${animal ? animal.name : 'Unknown'}: ${newTreatment.diagnosis}`,
            timestamp: new Date().toISOString(),
            user: 'Veterinarian'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  updateTreatment: (id, data) => {
    set((state) => {
      const updatedTreatments = state.treatments.map((t) =>
        t.id === id ? { ...t, ...data } : t
      )
      const treatment = state.treatments.find((t) => t.id === id)
      const animal = state.animals.find((a) => a.id === treatment?.animal_id)
      const updated = {
        ...state,
        treatments: updatedTreatments,
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Treatment',
            entity_id: id,
            action: `Treatment record updated for ${animal ? animal.name : 'Unknown'}`,
            timestamp: new Date().toISOString(),
            user: 'Veterinarian'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  },

  deleteTreatment: (id) => {
    set((state) => {
      const updated = {
        ...state,
        treatments: state.treatments.filter((t) => t.id !== id),
        activityLogs: [
          {
            id: 'log-' + generateUUID(),
            entity_type: 'Treatment',
            entity_id: id,
            action: `Treatment record deleted`,
            timestamp: new Date().toISOString(),
            user: 'Veterinarian'
          } as ActivityLog,
          ...state.activityLogs
        ]
      }
      saveLocalStorageDB(updated)
      return updated
    })
  }
}))
