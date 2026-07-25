import { Request, Response } from 'express'
import prisma from '../config/db'
import { parseId } from '../utils/parser'

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        incident_report: true,
        team: true,
        animals: true
      },
      orderBy: { created_at: 'desc' }
    })

    const mapped = await Promise.all(
      tickets.map(async (t) => {
        let animal = t.animals[0]
        if (!animal) {
          animal = (await prisma.animal.findFirst({
            where: { ticket_id: t.id }
          })) as any
        }

        const rescuerId = t.current_assigned_team_id ? `res-${t.current_assigned_team_id}` : null
        const shelterId = animal?.shelter_id ? `sh-${animal.shelter_id}` : null
        const animalId = animal ? `ani-${animal.id}` : null
        const incidentId = t.incident_report_id ? `inc-${t.incident_report_id}` : null

        return {
          id: `case-${t.id}`,
          incident_id: incidentId,
          case_number: `RC-2026-${t.id.toString().padStart(4, '0')}`,
          report_date: t.created_at.toISOString(),
          rescue_date: t.rescue_date ? t.rescue_date.toISOString() : null,
          location: t.incident_report?.location || (t.subject.includes('at ') ? t.subject.split('at ')[1] : 'Central Rescue Sector'),
          description: t.description,
          severity: t.priority as any,
          status: t.status as any,
          rescuer_id: rescuerId,
          shelter_id: shelterId,
          animal_id: animalId,
          notes: t.rescue_notes,
          created_at: t.created_at.toISOString()
        }
      })
    )

    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const createTicket = async (req: Request, res: Response) => {
  const { subject, description, priority, current_assigned_team_id, rescue_notes, rescue_date } = req.body

  try {
    const ticket = await prisma.ticket.create({
      data: {
        subject: subject || 'Rescue Case',
        description: description || '',
        priority: priority || 'Medium',
        status: 'REPORTED',
        rescue_notes: rescue_notes || '',
        current_assigned_team_id: parseId(current_assigned_team_id),
        rescue_date: rescue_date ? new Date(rescue_date) : null
      }
    })

    const caseNum = `RC-2026-${ticket.id.toString().padStart(4, '0')}`
    await prisma.activityLog.create({
      data: {
        entity_type: 'RescueCase',
        entity_id: ticket.id,
        action: `Rescue Case ${caseNum} registered at ${req.body.location || 'Unknown'}`,
        user: 'Dispatcher'
      }
    })

    res.status(201).json({
      id: `case-${ticket.id}`,
      case_number: caseNum,
      status: ticket.status,
      created_at: ticket.created_at.toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const updateTicket = async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, rescuer_id, shelter_id, notes, severity, description, rescue_date } = req.body

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid ticket ID' })

    const currentTicket = await prisma.ticket.findUnique({
      where: { id: parsedId },
      include: { animals: true }
    })

    if (!currentTicket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    const logs = []
    const updateData: any = {}

    if (status && status !== currentTicket.status) {
      updateData.status = status
      logs.push({
        entity_type: 'RescueCase',
        entity_id: currentTicket.id,
        action: `Case status updated from ${currentTicket.status} to ${status}`,
        user: 'Dispatcher'
      })

      const animal = currentTicket.animals[0]
      if (animal) {
        let animalStatus = null
        if (status === 'SHELTER_INTAKE') animalStatus = 'Intake'
        else if (status === 'UNDER_TREATMENT') animalStatus = 'Under Treatment'
        else if (status === 'RECOVERED') animalStatus = 'Recovered'
        else if (status === 'ADOPTED') animalStatus = 'Adopted'
        else if (status === 'RELEASED') animalStatus = 'Released'

        if (animalStatus) {
          await prisma.animal.update({
            where: { id: animal.id },
            data: { status: animalStatus }
          })
        }
      }
    }

    if (rescuer_id !== undefined) {
      const parsedRescuerId = parseId(rescuer_id)
      let teamId = null
      if (parsedRescuerId) {
        const agent = await prisma.agent.findUnique({
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
      updateData.current_assigned_team_id = teamId

      if (teamId !== currentTicket.current_assigned_team_id) {
        const team = teamId ? await prisma.team.findUnique({ where: { id: teamId } }) : null
        logs.push({
          entity_type: 'RescueCase',
          entity_id: currentTicket.id,
          action: `Rescuer team assigned: ${team ? team.team_name : 'None'}`,
          user: 'Dispatcher'
        })
      }
    }

    if (shelter_id !== undefined) {
      const parsedShelterId = parseId(shelter_id)
      
      const animal = currentTicket.animals[0]
      if (animal) {
        await prisma.animal.update({
          where: { id: animal.id },
          data: { shelter_id: parsedShelterId }
        })

        const shelter = parsedShelterId ? await prisma.shelter.findUnique({ where: { id: parsedShelterId } }) : null
        logs.push({
          entity_type: 'RescueCase',
          entity_id: currentTicket.id,
          action: `Shelter assigned: ${shelter ? shelter.shelter_name : 'None'}`,
          user: 'Dispatcher'
        })
      }
    }

    if (notes !== undefined) {
      updateData.rescue_notes = notes
    }

    if (severity !== undefined) {
      updateData.priority = severity
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (rescue_date !== undefined) {
      updateData.rescue_date = rescue_date ? new Date(rescue_date) : null
    } else if (status === 'RESCUED' && !currentTicket.rescue_date) {
      updateData.rescue_date = new Date()
    }

    const updated = await prisma.ticket.update({
      where: { id: parsedId },
      data: updateData,
      include: { animals: true }
    })

    if (logs.length > 0) {
      for (const log of logs) {
        await prisma.activityLog.create({ data: log })
      }
    } else {
      await prisma.activityLog.create({
        data: {
          entity_type: 'RescueCase',
          entity_id: updated.id,
          action: `Case details updated`,
          user: 'Dispatcher'
        }
      })
    }

    res.json({ message: 'Ticket updated successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteTicket = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid ticket ID' })

    await prisma.ticket.delete({
      where: { id: parsedId }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'RescueCase',
        entity_id: parsedId,
        action: `Rescue Case deleted`,
        user: 'Dispatcher'
      }
    })

    res.json({ message: 'Ticket deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
