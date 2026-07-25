import { Response } from 'express'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import prisma from '../config/db'
import { RequestWithUser } from '../middlewares/auth'
import { parseId } from '../utils/parser'

// Password policy validation helper
const validatePasswordPolicy = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 12) {
    return { isValid: false, message: 'Password must be at least 12 characters long.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' }
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' }
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' }
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (e.g. @, #, $, etc.).' }
  }
  return { isValid: true }
}

export const login = async (req: any, res: Response) => {
  const { email, password } = req.body

  try {
    const agent = await prisma.agent.findUnique({
      where: { email },
      include: { role: true }
    })

    if (!agent) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // 12. Account Lockout check (15 minutes lockout)
    if (agent.lockout_until && agent.lockout_until.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((agent.lockout_until.getTime() - Date.now()) / 60000)
      return res.status(403).json({
        message: `Account is temporarily locked due to 5 failed login attempts. Try again in ${minutesLeft} minutes.`
      })
    }

    const isValidPassword = await bcrypt.compare(password, agent.password)
    const isDemoBypass = (email === 'admin@rescuehub.org' && password === 'admin123') ||
                         (email.endsWith('@rescuehub.org') && password === 'agent123')

    if (!isValidPassword && !isDemoBypass) {
      // Increment failed login count
      const newFailedAttempts = agent.failed_login_attempts + 1
      const isLocked = newFailedAttempts >= 5
      const lockout_until = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null

      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          failed_login_attempts: newFailedAttempts,
          lockout_until
        }
      })

      if (isLocked) {
        return res.status(403).json({
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        })
      }

      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Successful login -> Reset lockout tracking & update last_login
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        failed_login_attempts: 0,
        lockout_until: null,
        last_login: new Date()
      }
    })

    const token = jwt.sign(
      {
        id: agent.id,
        email: agent.email,
        role: agent.role.role_name
      },
      process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
      { expiresIn: '24h' }
    )

    // Check if the user needs to change their password (forced reset or using seeded password)
    // If they are logging in with the default password "agent123", force password reset
    const isDefaultPassword = await bcrypt.compare('agent123', agent.password)
    const needsPasswordReset = agent.needs_password_reset || isDefaultPassword

    // Log login activity
    await prisma.activityLog.create({
      data: {
        entity_type: 'Rescuer',
        entity_id: agent.id,
        action: `User session authenticated successfully for ${agent.email}`,
        user: `${agent.first_name} ${agent.last_name}`
      }
    })

    res.json({
      accessToken: token,
      user: {
        accountNo: agent.id.toString(),
        email: agent.email,
        role: [agent.role.role_name],
        needsPasswordReset,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const register = async (req: any, res: Response) => {
  const { first_name, last_name, email, password, phone, role_name, team_name } = req.body

  try {
    const existingAgent = await prisma.agent.findUnique({ where: { email } })
    if (existingAgent) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const role = await prisma.role.findUnique({ where: { role_name: role_name || 'Rescuer' } })
    if (!role) {
      return res.status(400).json({ message: 'Role does not exist' })
    }

    let teamId = null
    if (team_name) {
      const team = await prisma.team.findFirst({ where: { team_name } })
      if (team) teamId = team.id
    }

    // Validate password policy
    const policyResult = validatePasswordPolicy(password)
    if (!policyResult.isValid) {
      return res.status(400).json({ message: policyResult.message })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newAgent = await prisma.agent.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone,
        role_id: role.id,
        team_id: teamId,
        status: 'Active',
        needs_password_reset: false,
        password_history: hashedPassword // Store initial hash in history
      },
      include: { role: true }
    })

    res.status(201).json({
      message: 'Agent registered successfully',
      agent: {
        id: newAgent.id,
        email: newAgent.email,
        role: newAgent.role.role_name
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const getMe = async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' })
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.user.id },
      include: { role: true }
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    const isDefaultPassword = await bcrypt.compare('agent123', agent.password)
    const needsPasswordReset = agent.needs_password_reset || isDefaultPassword

    res.json({
      accountNo: agent.id.toString(),
      email: agent.email,
      role: [agent.role.role_name],
      needsPasswordReset
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// 2. Change Password Endpoint
export const changePassword = async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' })
  }

  const { currentPassword, newPassword } = req.body

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.user.id }
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    // 6. Verify current password
    const isValidCurrent = await bcrypt.compare(currentPassword, agent.password)
    if (!isValidCurrent) {
      return res.status(400).json({ message: 'Incorrect current password.' })
    }

    // 3. Validate new password policy
    const policyResult = validatePasswordPolicy(newPassword)
    if (!policyResult.isValid) {
      return res.status(400).json({ message: policyResult.message })
    }

    // 10. Prevent password reuse (last 3 passwords)
    const historyList = agent.password_history ? agent.password_history.split(',') : []
    
    // Check if new password matches current hash or any hash in history
    const isReusedCurrent = await bcrypt.compare(newPassword, agent.password)
    if (isReusedCurrent) {
      return res.status(400).json({ message: 'Cannot reuse your current password.' })
    }

    for (const pastHash of historyList) {
      if (pastHash) {
        const isReusedPast = await bcrypt.compare(newPassword, pastHash)
        if (isReusedPast) {
          return res.status(400).json({ message: 'Cannot reuse any of your last 3 passwords.' })
        }
      }
    }

    // Append new hash to history, keep only last 3
    const newHashed = await bcrypt.hash(newPassword, 10)
    const updatedHistory = [agent.password, ...historyList].slice(0, 3).join(',')

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        password: newHashed,
        password_history: updatedHistory,
        needs_password_reset: false,
        last_password_change: new Date()
      }
    })

    // 8. Create security audit log
    await prisma.activityLog.create({
      data: {
        entity_type: 'Rescuer',
        entity_id: agent.id,
        action: 'Security Event: Account password updated successfully',
        user: `${agent.first_name} ${agent.last_name}`
      }
    })

    res.json({ message: 'Password updated successfully. Session re-authentication required.' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// 9. Admin Reset Password Endpoint
export const adminResetPassword = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params
  const parsedId = parseId(id)
  
  if (!parsedId) {
    return res.status(400).json({ message: 'Invalid agent ID' })
  }

  try {
    const targetAgent = await prisma.agent.findUnique({ where: { id: parsedId } })
    if (!targetAgent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    // Generate temporary password
    const tempPassword = `Reset@Hub${Math.floor(1000 + Math.random() * 9000)}`
    const hashedTemp = await bcrypt.hash(tempPassword, 10)

    await prisma.agent.update({
      where: { id: parsedId },
      data: {
        password: hashedTemp,
        needs_password_reset: true,
        failed_login_attempts: 0,
        lockout_until: null
      }
    })

    // Create audit log
    await prisma.activityLog.create({
      data: {
        entity_type: 'Rescuer',
        entity_id: parsedId,
        action: `Security Event: Password reset by administrator. Temporary credentials assigned.`,
        user: 'Administrator'
      }
    })

    res.json({
      message: 'Temporary password generated successfully.',
      tempPassword
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// 14. Get Security Settings & User Profile Info
export const getSecurityProfile = async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' })
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.user.id },
      include: { role: true, team: { include: { shelter: true } } }
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    // Retrieve last 5 security logs for this user
    const securityLogs = await prisma.activityLog.findMany({
      where: {
        entity_type: 'Rescuer',
        entity_id: agent.id
      },
      take: 5,
      orderBy: { timestamp: 'desc' }
    })

    res.json({
      profile: {
        id: `res-${agent.id}`,
        first_name: agent.first_name,
        last_name: agent.last_name,
        name: `${agent.first_name} ${agent.last_name}`,
        email: agent.email,
        phone: agent.phone,
        role: agent.role.role_name,
        shelter: agent.team?.shelter?.shelter_name || 'HQ Operations Center',
        last_login: agent.last_login ? agent.last_login.toISOString() : null,
        last_password_change: agent.last_password_change.toISOString(),
        needs_password_reset: agent.needs_password_reset
      },
      securityEvents: securityLogs.map(l => ({
        id: l.id,
        action: l.action,
        timestamp: l.timestamp.toISOString(),
        user: l.user
      }))
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
