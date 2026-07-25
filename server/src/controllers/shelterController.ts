import { Request, Response } from 'express'
import prisma from '../config/db'
import { parseId } from '../utils/parser'

export const getShelters = async (req: Request, res: Response) => {
  try {
    const shelters = await prisma.shelter.findMany({
      orderBy: { created_at: 'desc' }
    })

    const mapped = shelters.map(s => ({
      id: `sh-${s.id}`,
      name: s.shelter_name,
      address: s.address,
      contact_person: s.contact_number,
      capacity: s.capacity,
      created_at: s.created_at.toISOString()
    }))

    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const createShelter = async (req: Request, res: Response) => {
  const { name, address, contact_person, capacity } = req.body

  try {
    const shelter = await prisma.shelter.create({
      data: {
        shelter_name: name || 'New Shelter',
        address: address || '',
        contact_number: contact_person || '',
        capacity: parseInt(capacity) || 10
      }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'Shelter',
        entity_id: shelter.id,
        action: `New shelter added: ${shelter.shelter_name} (Capacity: ${shelter.capacity})`,
        user: 'Manager'
      }
    })

    res.status(201).json({
      id: `sh-${shelter.id}`,
      name: shelter.shelter_name,
      address: shelter.address,
      contact_person: shelter.contact_number,
      capacity: shelter.capacity,
      created_at: shelter.created_at.toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const updateShelter = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, address, contact_person, capacity } = req.body

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid shelter ID' })

    const currentShelter = await prisma.shelter.findUnique({
      where: { id: parsedId }
    })

    if (!currentShelter) {
      return res.status(404).json({ message: 'Shelter not found' })
    }

    const updated = await prisma.shelter.update({
      where: { id: parsedId },
      data: {
        shelter_name: name,
        address,
        contact_number: contact_person,
        capacity: capacity ? parseInt(capacity) : undefined
      }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'Shelter',
        entity_id: updated.id,
        action: `Shelter ${updated.shelter_name} information updated`,
        user: 'Manager'
      }
    })

    res.json({ message: 'Shelter updated successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteShelter = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid shelter ID' })

    await prisma.shelter.delete({
      where: { id: parsedId }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'Shelter',
        entity_id: parsedId,
        action: `Shelter deleted`,
        user: 'Manager'
      }
    })

    res.json({ message: 'Shelter deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'Cannot delete shelter: It has active animal or volunteer team assignments associated with it.'
      })
    }
    res.status(500).json({ message: error.message })
  }
}
