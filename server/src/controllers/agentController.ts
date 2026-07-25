import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import prisma from '../config/db'
import { parseId } from '../utils/parser'

export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      include: { role: true, team: { include: { shelter: true } } },
      orderBy: { id: 'asc' }
    })

    const mapped = agents.map((a) => {
      const roleName = a.role ? a.role.role_name : 'Rescuer'
      
      // Determine operational status
      let operationalStatus = 'Available'
      if (a.status === 'Offline') operationalStatus = 'Off Duty'
      else if (a.status === 'Busy') {
        operationalStatus = roleName === 'Veterinarian' ? 'Treating Animal' : 'On Rescue'
      } else if (a.status === 'Active' || a.status === 'Available') {
        operationalStatus = 'Available'
      } else {
        operationalStatus = a.status
      }

      // Determine shelter & team IDs dynamically
      const shelter_id = a.team?.base_shelter_id
        ? `sh-${a.team.base_shelter_id}`
        : a.id % 3 === 0 ? 'sh-1' : a.id % 3 === 1 ? 'sh-2' : 'sh-3'

      const team_id = a.team_id
        ? `team-${a.team_id}`
        : roleName === 'Veterinarian' ? 'team-3' : roleName === 'Dispatcher' ? 'team-2' : 'team-1'

      const defaultSkills =
        roleName === 'Veterinarian'
          ? 'Surgery, Clinical Diagnostics, Wildlife Trauma Care'
          : roleName === 'Dispatcher'
          ? 'Emergency Triage, Resource Dispatch, Communications'
          : 'Canine Handling, Field Trapping, Emergency First Aid'

      const defaultCert =
        roleName === 'Veterinarian'
          ? 'DVM, Licensed Veterinary Practitioner'
          : roleName === 'Dispatcher'
          ? 'Emergency Dispatch Certified (EDC)'
          : 'Certified Animal Rescue Specialist (CARS)'

      return {
        id: `res-${a.id}`,
        name: `${a.first_name} ${a.last_name}`,
        role: roleName,
        phone: a.phone || '555-0199',
        email: a.email,
        shelter_id,
        team_id,
        status: operationalStatus,
        availability: (operationalStatus === 'Off Duty' ? 'On Leave' : operationalStatus === 'Available' ? 'Available' : 'Busy') as any,
        skills: defaultSkills,
        certifications: defaultCert,
        experience_years: ((a.id * 2) % 8) + 2,
        emergency_contact: `555-900${a.id}`,
        notes:
          operationalStatus === 'On Rescue'
            ? 'Assigned to active field dispatch ticket.'
            : operationalStatus === 'Treating Animal'
            ? 'In clinic performing animal health evaluation.'
            : 'Available for immediate dispatch assignment.',
        created_at: new Date().toISOString()
      }
    })

    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const createAgent = async (req: Request, res: Response) => {
  const { name, role, phone, email, skills, status, shelter_id, team_id } = req.body

  try {
    const existing = await prisma.agent.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const names = (name || 'New Personnel').split(' ')
    const first_name = names[0]
    const last_name = names.slice(1).join(' ') || 'User'

    const roleName = role || 'Rescuer'
    const roleRecord = await prisma.role.findFirst({
      where: { role_name: roleName }
    })

    const hashedPassword = await bcrypt.hash('agent123', 10)

    const agent = await prisma.agent.create({
      data: {
        first_name,
        last_name,
        email,
        phone: phone || '555-0199',
        password: hashedPassword,
        role_id: roleRecord ? roleRecord.id : 2,
        status: status || 'Available'
      }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'Rescuer',
        entity_id: agent.id,
        action: `New personnel profile created: ${name} (${roleName})`,
        user: 'Manager'
      }
    })

    res.status(201).json({
      id: `res-${agent.id}`,
      name: `${agent.first_name} ${agent.last_name}`,
      role: roleName,
      phone: agent.phone,
      email: agent.email,
      shelter_id: shelter_id || 'sh-1',
      team_id: team_id || 'team-1',
      status: status || 'Available',
      availability: (status === 'Off Duty' ? 'On Leave' : status === 'Available' ? 'Available' : 'Busy') as any,
      skills: skills || 'Canine Handling, Trapping, First Aid',
      certifications: 'Certified Rescue Specialist',
      experience_years: 3,
      emergency_contact: '555-9000',
      notes: 'Personnel profile added to operations roster.',
      created_at: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAgent = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, role, phone, email, status, skills, shelter_id, team_id } = req.body

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid agent ID' })

    const currentAgent = await prisma.agent.findUnique({
      where: { id: parsedId }
    })

    if (!currentAgent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    const data: any = {}
    if (name) {
      const names = name.split(' ')
      data.first_name = names[0]
      data.last_name = names.slice(1).join(' ') || ''
    }
    if (phone !== undefined) data.phone = phone
    if (email !== undefined) data.email = email
    if (status !== undefined) data.status = status

    if (role) {
      const roleRecord = await prisma.role.findFirst({ where: { role_name: role } })
      if (roleRecord) data.role_id = roleRecord.id
    }

    const updated = await prisma.agent.update({
      where: { id: parsedId },
      data,
      include: { role: true }
    })

    res.json({
      id: `res-${updated.id}`,
      name: `${updated.first_name} ${updated.last_name}`,
      role: updated.role ? updated.role.role_name : role || 'Rescuer',
      phone: updated.phone,
      email: updated.email,
      shelter_id: shelter_id || 'sh-1',
      team_id: team_id || 'team-1',
      status: updated.status || 'Available',
      availability: (updated.status === 'Off Duty' ? 'On Leave' : updated.status === 'Available' ? 'Available' : 'Busy') as any,
      skills: skills || 'Canine Handling, Trapping, First Aid',
      created_at: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAgent = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid agent ID' })

    await prisma.agent.delete({
      where: { id: parsedId }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'Rescuer',
        entity_id: parsedId,
        action: `Rescuer profile deleted`,
        user: 'Manager'
      }
    })

    res.json({ message: 'Agent deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'Cannot delete personnel profile: They are currently associated with active rescue cases, shelter management, or veterinary treatment records.'
      })
    }
    res.status(500).json({ message: error.message })
  }
}
