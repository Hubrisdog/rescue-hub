import { Request, Response } from 'express'
import prisma from '../config/db'
import { parseId } from '../utils/parser'
import fs from 'fs'
import path from 'path'

const saveBase64Image = (base64Str: string | null): string | null => {
  if (!base64Str) return null
  if (!base64Str.startsWith('data:image/')) return base64Str // Already a URL or path

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) return base64Str

    const mimeType = matches[1]
    const base64Data = matches[2]
    const extension = mimeType.split('/')[1] || 'png'
    const filename = `animal-${Date.now()}-${Math.floor(Math.random() * 100000)}.${extension}`
    
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'animals')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
    
    return `http://localhost:5000/uploads/animals/${filename}`
  } catch (error) {
    console.error('Error saving base64 image:', error)
    return base64Str
  }
}

export const getAnimals = async (req: Request, res: Response) => {
  try {
    const animals = await prisma.animal.findMany({
      include: { species: true },
      orderBy: { created_at: 'desc' }
    })

    const mapped = animals.map(a => ({
      id: a.id.toString(),
      name: a.name,
      species: a.species.species_name,
      breed: a.breed || 'Unknown Mix',
      sex: a.sex,
      estimated_age: a.age_estimate,
      weight: a.weight,
      color: a.color || 'Unknown',
      condition: a.condition,
      notes: a.notes || '',
      status: a.status as any,
      photo_url: a.photo_url,
      shelter_id: a.shelter_id ? `sh-${a.shelter_id}` : null, // keep the frontend-expected prefix format!
      case_id: a.ticket_id ? `case-${a.ticket_id}` : null,
      created_at: a.created_at.toISOString()
    }))

    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const createAnimal = async (req: Request, res: Response) => {
  const { name, species, breed, color, notes, sex, estimated_age, weight, condition, status, photo_url, shelter_id, case_id } = req.body

  try {
    let speciesRecord = await prisma.species.findUnique({
      where: { species_name: species || 'Other' }
    })

    if (!speciesRecord) {
      speciesRecord = await prisma.species.create({
        data: { species_name: species || 'Other' }
      })
    }

    const animal = await prisma.animal.create({
      data: {
        name: name || 'Unnamed Animal',
        species_id: speciesRecord.id,
        breed: breed || 'Unknown Mix',
        color: color || 'Unknown',
        notes: notes || '',
        sex: sex || 'Unknown',
        age_estimate: estimated_age || 'Unknown',
        weight: parseFloat(weight) || 0,
        condition: condition || '',
        status: status || 'Intake',
        photo_url: saveBase64Image(photo_url),
        shelter_id: parseId(shelter_id),
        ticket_id: parseId(case_id)
      }
    })

    // Log action
    await prisma.activityLog.create({
      data: {
        entity_type: 'Animal',
        entity_id: animal.id,
        action: `Animal record registered: ${animal.name} (${species})`,
        user: 'Dispatcher'
      }
    })

    res.status(201).json({
      id: animal.id.toString(),
      name: animal.name,
      species,
      breed: animal.breed,
      color: animal.color,
      notes: animal.notes,
      sex: animal.sex,
      estimated_age: animal.age_estimate,
      weight: animal.weight,
      condition: animal.condition,
      status: animal.status,
      photo_url: animal.photo_url,
      shelter_id: animal.shelter_id ? animal.shelter_id.toString() : null,
      case_id: animal.ticket_id ? animal.ticket_id.toString() : null,
      created_at: animal.created_at.toISOString()
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const updateAnimal = async (req: Request, res: Response) => {
  const { id } = req.params
  const data = req.body

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid animal ID' })

    const currentAnimal = await prisma.animal.findUnique({
      where: { id: parsedId }
    })

    if (!currentAnimal) {
      return res.status(404).json({ message: 'Animal not found' })
    }

    // Resolve species if changed
    let speciesId = currentAnimal.species_id
    if (data.species) {
      let speciesRecord = await prisma.species.findUnique({
        where: { species_name: data.species }
      })
      if (!speciesRecord) {
        speciesRecord = await prisma.species.create({
          data: { species_name: data.species }
        })
      }
      speciesId = speciesRecord.id
    }

    const updated = await prisma.animal.update({
      where: { id: parsedId },
      data: {
        name: data.name,
        species_id: speciesId,
        breed: data.breed,
        color: data.color,
        notes: data.notes,
        sex: data.sex,
        age_estimate: data.estimated_age,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        condition: data.condition,
        status: data.status,
        photo_url: data.photo_url !== undefined ? saveBase64Image(data.photo_url) : undefined,
        shelter_id: data.shelter_id !== undefined ? parseId(data.shelter_id) : undefined,
        ticket_id: data.case_id !== undefined ? parseId(data.case_id) : undefined
      }
    })

    // Log action
    const actionText = data.status && data.status !== currentAnimal.status
      ? `Animal ${currentAnimal.name} status changed from ${currentAnimal.status} to ${data.status}`
      : `Animal ${currentAnimal.name} details updated`

    await prisma.activityLog.create({
      data: {
        entity_type: 'Animal',
        entity_id: updated.id,
        action: actionText,
        user: 'Staff'
      }
    })

    res.json({ message: 'Animal updated successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAnimal = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const parsedId = parseId(id)
    if (!parsedId) return res.status(400).json({ message: 'Invalid animal ID' })

    await prisma.animal.delete({
      where: { id: parsedId }
    })

    await prisma.activityLog.create({
      data: {
        entity_type: 'Animal',
        entity_id: parsedId,
        action: `Animal record deleted`,
        user: 'Staff'
      }
    })

    res.json({ message: 'Animal deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
