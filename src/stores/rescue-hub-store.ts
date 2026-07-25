import { create } from 'zustand'
import { useAuthStore } from './auth-store'

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
  | 'Ready for Adoption'
  | 'Ready for Release'
  | 'Adopted'
  | 'Released'

export type RescuerAvailabilityType = 'Available' | 'Busy' | 'On Leave'

export interface IncidentReport {
  id: string
  reporter_name: string
  contact_number?: string
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
  notes?: string
  status: AnimalStatusType
  photo_url: string | null
  shelter_id: string | null
  case_id: string | null
  created_at: string
}

export type PersonnelRoleType = 'Admin' | 'Dispatcher' | 'Veterinarian' | 'Rescuer' | 'Shelter Staff'
export type PersonnelStatusType = 'Available' | 'Responding' | 'On Rescue' | 'Treating Animal' | 'Off Duty'

export interface Rescuer {
  id: string
  name: string
  role: PersonnelRoleType
  phone: string
  email: string
  shelter_id?: string | null
  team_id?: string | null
  status: PersonnelStatusType
  availability: RescuerAvailabilityType
  skills: string
  certifications?: string
  experience_years?: number
  emergency_contact?: string
  notes?: string
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

export type MedicalRecommendationType =
  | 'Ready for Adoption'
  | 'Ready for Release'
  | 'Continue Treatment'
  | 'Under Observation'
  | 'Critical Care'

export interface Treatment {
  id: string
  animal_id: string
  date: string
  treatment_date?: string
  veterinarian: string
  diagnosis: string
  medication: string
  procedure: string
  follow_up_date: string | null
  notes: string
  recommendation?: MedicalRecommendationType
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

  // Sync action
  fetchInitialData: () => Promise<void>

  // Incidents CRUD
  addIncident: (incident: Omit<IncidentReport, 'id' | 'created_at'>) => void
  updateIncident: (id: string, incident: Partial<IncidentReport>) => void
  deleteIncident: (id: string) => void
  promoteIncidentToCase: (id: string, rescuerId?: string | null, shelterId?: string | null) => Promise<string | null>

  // Cases CRUD
  addCase: (rescueCase: Omit<RescueCase, 'id' | 'created_at' | 'case_number'>) => void
  updateCase: (id: string, rescueCase: Partial<RescueCase>) => string | null
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

// Validation rules - Full operational status flexibility for dispatchers & administrators
const ALL_STATUSES: RescueCaseStatusType[] = [
  'REPORTED',
  'ASSIGNED',
  'EN_ROUTE',
  'RESCUED',
  'SHELTER_INTAKE',
  'UNDER_TREATMENT',
  'RECOVERED',
  'ADOPTED',
  'RELEASED',
  'CLOSED',
]

export const VALID_CASE_TRANSITIONS: Record<RescueCaseStatusType, RescueCaseStatusType[]> = {
  REPORTED: ALL_STATUSES,
  ASSIGNED: ALL_STATUSES,
  EN_ROUTE: ALL_STATUSES,
  RESCUED: ALL_STATUSES,
  SHELTER_INTAKE: ALL_STATUSES,
  UNDER_TREATMENT: ALL_STATUSES,
  RECOVERED: ALL_STATUSES,
  ADOPTED: ALL_STATUSES,
  RELEASED: ALL_STATUSES,
  CLOSED: ALL_STATUSES,
}

const getHeaders = () => {
  const token = useAuthStore.getState().auth.accessToken
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const useRescueHubStore = create<RescueHubState>()((set, get) => {
  const fetchInitialData = async () => {
    try {
      const headers = getHeaders()
      
      const [incidents, cases, animals, rescuers, shelters, treatments, activityLogs] = await Promise.all([
        fetch('http://localhost:5000/api/incidents', { headers }).then(r => r.json()),
        fetch('http://localhost:5000/api/tickets', { headers }).then(r => r.json()),
        fetch('http://localhost:5000/api/animals', { headers }).then(r => r.json()),
        fetch('http://localhost:5000/api/agents', { headers }).then(r => r.json()),
        fetch('http://localhost:5000/api/shelters', { headers }).then(r => r.json()),
        fetch('http://localhost:5000/api/treatments', { headers }).then(r => r.json()),
        fetch('http://localhost:5000/api/logs', { headers }).then(r => r.json())
      ])

      set({
        incidents: Array.isArray(incidents) ? incidents : [],
        cases: Array.isArray(cases) ? cases : [],
        animals: Array.isArray(animals) ? animals : [],
        rescuers: Array.isArray(rescuers) ? rescuers : [],
        shelters: Array.isArray(shelters) ? shelters : [],
        treatments: Array.isArray(treatments) ? treatments : [],
        activityLogs: Array.isArray(activityLogs) ? activityLogs : []
      })
    } catch (e) {
      console.error('Failed to sync database state with server', e)
    }
  }

  // Fetch initial data on load if token is already present
  setTimeout(() => {
    if (useAuthStore.getState().auth.accessToken) {
      fetchInitialData()
    }
  }, 100)

  return {
    incidents: [],
    cases: [],
    animals: [],
    rescuers: [],
    shelters: [],
    treatments: [],
    activityLogs: [],

    fetchInitialData,

    // Incidents CRUD
    addIncident: async (incident) => {
      try {
        await fetch('http://localhost:5000/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, // incident creation can be public
          body: JSON.stringify({
            ...incident,
            species: incident.description.toLowerCase().includes('dog') ? 'Dog' : incident.description.toLowerCase().includes('cat') ? 'Cat' : incident.description.toLowerCase().includes('bird') ? 'Bird' : 'Other',
            is_anonymous: false
          })
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    updateIncident: async (id, incident) => {
      try {
        await fetch(`http://localhost:5000/api/incidents/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(incident)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    deleteIncident: async (id) => {
      try {
        await fetch(`http://localhost:5000/api/incidents/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    promoteIncidentToCase: async (id, rescuerId, shelterId) => {
      try {
        const res = await fetch(`http://localhost:5000/api/incidents/${id}/promote`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ rescuerId, shelterId })
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          return errData.message || 'Failed to promote incident report.'
        }
        get().fetchInitialData()
        return null
      } catch (e: any) {
        console.error(e)
        return e.message || 'Failed to connect to the server.'
      }
    },

    // Cases CRUD
    addCase: async (caseData) => {
      try {
        await fetch('http://localhost:5000/api/tickets', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            subject: `Rescue Case at ${caseData.location}`,
            description: caseData.description,
            priority: caseData.severity,
            current_assigned_team_id: caseData.rescuer_id,
            rescue_notes: caseData.notes,
            rescue_date: caseData.rescue_date
          })
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    updateCase: (id, data) => {
      const currentCase = get().cases.find((c) => c.id === id)
      if (!currentCase) return 'Case not found'

      if (data.status && data.status !== currentCase.status) {
        const allowed = VALID_CASE_TRANSITIONS[currentCase.status]
        if (!allowed.includes(data.status)) {
          return `Invalid status transition: Cannot change case from ${currentCase.status} to ${data.status}`
        }
      }

      fetch(`http://localhost:5000/api/tickets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status: data.status,
          rescuer_id: data.rescuer_id,
          shelter_id: data.shelter_id,
          notes: data.notes,
          severity: data.severity,
          description: data.description,
          rescue_date: data.rescue_date
        })
      }).then(() => {
        get().fetchInitialData()
      }).catch(err => {
        console.error(err)
      })

      return null
    },

    deleteCase: async (id) => {
      try {
        await fetch(`http://localhost:5000/api/tickets/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    // Animals CRUD
    addAnimal: async (animal) => {
      try {
        await fetch('http://localhost:5000/api/animals', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(animal)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    updateAnimal: async (id, animal) => {
      try {
        await fetch(`http://localhost:5000/api/animals/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(animal)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    deleteAnimal: async (id) => {
      try {
        await fetch(`http://localhost:5000/api/animals/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    // Rescuers CRUD
    addRescuer: async (rescuer) => {
      try {
        await fetch('http://localhost:5000/api/agents', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(rescuer)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    updateRescuer: async (id, rescuer) => {
      try {
        await fetch(`http://localhost:5000/api/agents/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(rescuer)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    deleteRescuer: async (id) => {
      try {
        await fetch(`http://localhost:5000/api/agents/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    // Shelters CRUD
    addShelter: async (shelter) => {
      try {
        await fetch('http://localhost:5000/api/shelters', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(shelter)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    updateShelter: async (id, shelter) => {
      try {
        await fetch(`http://localhost:5000/api/shelters/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(shelter)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    deleteShelter: async (id) => {
      try {
        await fetch(`http://localhost:5000/api/shelters/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    // Treatments CRUD
    addTreatment: async (treatment) => {
      try {
        await fetch('http://localhost:5000/api/treatments', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(treatment)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    updateTreatment: async (id, treatment) => {
      try {
        await fetch(`http://localhost:5000/api/treatments/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(treatment)
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    },

    deleteTreatment: async (id) => {
      try {
        await fetch(`http://localhost:5000/api/treatments/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        get().fetchInitialData()
      } catch (e) {
        console.error(e)
      }
    }
  }
})
