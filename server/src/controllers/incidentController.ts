import { Request, Response } from 'express'
import prisma from '../config/db'
import { parseId } from '../utils/parser'

export const getIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident_Report.findMany({
      include: { species: true },
      orderBy: { created_at: 'desc' }
    })
    
    const mapped = incidents.map(inc => ({
      id: `inc-${inc.id}`,
      reporter_name: inc.reporter_name || 'Anonymous',
      contact_number: inc.contact_number || '',
      report_date: inc.created_at.toISOString(),
      location: inc.location,
      description: inc.description,
      severity: inc.severity as any,
      status: inc.status as any,
      created_at: inc.created_at.toISOString()
    }))
    
    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const createIncident = async (req: Request, res: Response) => {
  const { reporter_name, location, description, severity, species, is_anonymous } = req.body

  try {
    let speciesRecord = await prisma.species.findUnique({
      where: { species_name: species || 'Other' }
    })

    if (!speciesRecord) {
      speciesRecord = await prisma.species.create({
        data: { species_name: species || 'Other' }
      })
    }

    const newIncident = await prisma.incident_Report.create({
      data: {
        reporter_name: is_anonymous ? 'Anonymous' : (reporter_name || 'Anonymous'),
        contact_number: req.body.contact_number || '',
        is_anonymous: !!is_anonymous,
        species_id: speciesRecord.id,
        severity: severity || 'Medium',
        status: 'Pending',
        location: location || 'Unknown',
        latitude: parseFloat(req.body.latitude) || 10.315,
        longitude: parseFloat(req.body.longitude) || 123.902,
        photo: req.body.photo || null,
        description: description || ''
      }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'IncidentReport',
        entity_id: newIncident.id,
        action: `Incident report submitted by ${newIncident.reporter_name}`,
        user: 'Citizen Reporter'
      }
    })

    res.status(201).json({
      id: `inc-${newIncident.id}`,
      reporter_name: newIncident.reporter_name,
      contact_number: newIncident.contact_number || '',
      report_date: newIncident.created_at.toISOString(),
      location: newIncident.location,
      description: newIncident.description,
      severity: newIncident.severity as any,
      status: newIncident.status as any,
      created_at: newIncident.created_at.toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const updateIncident = async (req: Request, res: Response) => {
  const { id } = req.params
  const data = req.body

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid incident ID' })

    const updated = await prisma.incident_Report.update({
      where: { id: parsedId },
      data: {
        status: data.status,
        severity: data.severity,
        description: data.description,
        location: data.location
      }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'IncidentReport',
        entity_id: updated.id,
        action: `Incident report status updated: ${updated.status}`,
        user: 'Dispatcher'
      }
    })

    res.json({
      id: `inc-${updated.id}`,
      reporter_name: updated.reporter_name,
      contact_number: updated.contact_number || '',
      report_date: updated.created_at.toISOString(),
      location: updated.location,
      description: updated.description,
      severity: updated.severity as any,
      status: updated.status as any,
      created_at: updated.created_at.toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteIncident = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid incident ID' })

    await prisma.incident_Report.delete({
      where: { id: parsedId }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'IncidentReport',
        entity_id: parsedId,
        action: `Incident report removed`,
        user: 'Dispatcher'
      }
    })

    res.json({ message: 'Incident deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'Cannot delete incident report: It has already been promoted to an active rescue case.'
      })
    }
    res.status(500).json({ message: error.message })
  }
}

export const promoteIncident = async (req: Request, res: Response) => {
  const { id } = req.params
  const { rescuerId, shelterId } = req.body

  try {
    const parsedIncidentId = parseId(id)
    if (!parsedIncidentId) return res.status(400).json({ message: 'Invalid incident ID' })

    const incident = await prisma.incident_Report.findUnique({
      where: { id: parsedIncidentId },
      include: { species: true }
    })

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' })
    }

    const parsedRescuerId = parseId(rescuerId)
    const parsedShelterId = parseId(shelterId)

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.ticket.count()
      const caseIndex = count + 1
      const caseNum = `RC-2026-${caseIndex.toString().padStart(4, '0')}`

      let teamId = null
      if (parsedRescuerId) {
        const agent = await tx.agent.findUnique({
          where: { id: parsedRescuerId },
          include: { role: true }
        })
        if (agent) {
          if (agent.team_id) {
            teamId = agent.team_id
          } else {
            const roleName = agent.role?.role_name
            teamId = roleName === 'Veterinarian' ? 3 : roleName === 'Dispatcher' ? 2 : 1
          }
        }
      }

      const ticket = await tx.ticket.create({
        data: {
          subject: `Rescue Case for promoted report`,
          incident_report_id: incident.id,
          status: parsedRescuerId ? 'ASSIGNED' : 'REPORTED',
          priority: incident.severity,
          rescue_notes: 'Promoted from Incident Report.',
          description: incident.description,
          current_assigned_team_id: teamId
        }
      })

      const animal = await tx.animal.create({
        data: {
          name: 'Unnamed Animal',
          species_id: incident.species_id,
          breed: 'Unknown Mix',
          sex: 'Unknown',
          age_estimate: 'Unknown',
          weight: 0,
          condition: incident.description,
          status: 'Intake',
          ticket_id: ticket.id,
          shelter_id: parsedShelterId
        }
      })

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          subject: `Rescue Case for Unnamed Animal (${incident.species.species_name})`
        }
      })

      await tx.incident_Report.update({
        where: { id: incident.id },
        data: { status: 'Approved' }
      })

      await tx.activityLog.create({
        data: {
          entity_type: 'RescueCase',
          entity_id: ticket.id,
          action: `Rescue Case ${caseNum} approved and created from Incident Report`,
          user: 'Dispatcher'
        }
      })

      return { ticket, animal }
    })

    res.json({
      message: 'Incident promoted successfully',
      ticketId: `case-${result.ticket.id}`,
      animalId: `ani-${result.animal.id}`
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
