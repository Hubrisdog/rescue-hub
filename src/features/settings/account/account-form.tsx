import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Lock,
  Shield,
  History,
  User,
  Clock,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  Hourglass,
  Check,
  X
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SecurityProfileData {
  profile: {
    id: string
    first_name: string
    last_name: string
    name: string
    email: string
    phone: string
    role: string
    shelter: string
    last_login: string | null
    last_password_change: string
    needs_password_reset: boolean
  }
  securityEvents: Array<{
    id: number
    action: string
    timestamp: string
    user: string
  }>
}

export function AccountForm() {
  const { auth } = useAuthStore()
  const [profileData, setProfileData] = useState<SecurityProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Session timer state
  const [sessionTimeLeft, setSessionTimeLeft] = useState('24:00:00')

  // Show/Hide password states
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Fetch security profile data
  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/security-profile', {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`
        }
      })
      if (!res.ok) throw new Error('Failed to load profile')
      const data = await res.json()
      setProfileData(data)
    } catch (e) {
      console.error(e)
      toast.error('Could not fetch security profile data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    // 2. Session Expiration Countdown Timer
    const timer = setInterval(() => {
      const exp = auth.user?.exp || 0
      const diff = exp - Date.now()
      if (diff <= 0) {
        setSessionTimeLeft('Expired')
        clearInterval(timer)
        auth.reset()
        toast.error('Session expired. Please log in again.')
      } else {
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setSessionTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [auth.user])

  // Dynamic Password Validation Checks
  const hasMinLength = newPassword.length >= 12
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[!@#$%^&*(),.?\":{}|<>]/.test(newPassword)

  const passedChecksCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial
  ].filter(Boolean).length

  // Calculate Strength Label and color
  const getStrengthConfig = () => {
    if (newPassword.length === 0) return { label: 'None', color: 'bg-muted', textClass: 'text-muted-foreground', width: 'w-0' }
    if (passedChecksCount <= 2) return { label: 'Weak', color: 'bg-red-500', textClass: 'text-red-500', width: 'w-1/3' }
    if (passedChecksCount <= 4) return { label: 'Medium Strength', color: 'bg-amber-500', textClass: 'text-amber-500', width: 'w-2/3' }
    return { label: 'Very Strong', color: 'bg-emerald-500', textClass: 'text-emerald-500', width: 'w-full' }
  }

  const strength = getStrengthConfig()

  const handlePasswordFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error('Please enter your current password.')
      return
    }
    if (passedChecksCount < 5) {
      toast.error('Password does not meet all security policy requirements.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.')
      return
    }

    // Open verification dialog before password change
    setShowConfirmDialog(true)
  }

  const executePasswordChange = async () => {
    setShowConfirmDialog(false)
    setSubmitting(true)

    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      toast.success('Password updated successfully! Force logging out of all sessions...')
      
      // Session Security: Force logout after password change
      setTimeout(() => {
        auth.reset()
      }, 2000)

    } catch (e: any) {
      toast.error(e.message || 'Error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-12 space-y-3 text-sm text-muted-foreground'>
        <div className='h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full' />
        <span>Loading RescueHub Security Center...</span>
      </div>
    )
  }

  const userProfile = profileData?.profile
  const userRole = userProfile?.role || 'Rescuer'

  // Dynamic Permission Matrix checklist based on active role
  const getPermissionsForRole = (role: string) => {
    const is = (flag: boolean) => flag ? <Check className='h-4 w-4 text-emerald-500 font-extrabold shrink-0' /> : <X className='h-4 w-4 text-rose-500 shrink-0' />
    const admin = role === 'Admin'
    const disp = role === 'Dispatcher'
    const vet = role === 'Veterinarian'
    const staff = role === 'Shelter Staff'
    const resc = role === 'Rescuer'

    return [
      { name: 'User & Personnel Management', desc: 'Add/edit responders & reset passwords', allowed: is(admin) },
      { name: 'Incident Call Validation', desc: 'Approve & promote incoming citizen reports', allowed: is(admin || disp) },
      { name: 'Rescue Operations Dispatch', desc: 'Assign shelters & responders to case files', allowed: is(admin || disp) },
      { name: 'Animal Operations Registry', desc: 'Manage shelter registry intake & details', allowed: is(admin || staff || vet) },
      { name: 'Clinical Treatments & Assessments', desc: 'Perform surgeries & issue medical clearance', allowed: is(admin || vet) },
      { name: 'System Activity Logs', desc: 'Access full operational audit trail history', allowed: is(admin) },
    ]
  }

  const permissions = getPermissionsForRole(userRole)

  return (
    <div className='w-full space-y-6'>
      {/* Forced Reset Warning Banner */}
      {userProfile?.needs_password_reset && (
        <div className='p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex gap-3 text-xs leading-relaxed animate-pulse'>
          <AlertCircle className='h-5 w-5 shrink-0' />
          <div>
            <strong className='block font-bold text-sm'>Forced Password Reset Required</strong>
            You are currently logged in with a temporary or default credential. You must configure a new, policy-compliant password below to unlock your workspace.
          </div>
        </div>
      )}

      {/* 1. Account Security Dashboard Summary */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='border-emerald-500/10 shadow-sm'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-0.5'>
              <span className='text-[10px] uppercase font-bold text-muted-foreground'>Account Status</span>
              <h4 className='text-sm font-black text-emerald-600 dark:text-emerald-400'>ACTIVE</h4>
            </div>
            <ShieldCheck className='h-8 w-8 text-emerald-500 opacity-30' />
          </CardContent>
        </Card>

        <Card className='border-emerald-500/10 shadow-sm'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-0.5'>
              <span className='text-[10px] uppercase font-bold text-muted-foreground'>Password Strength</span>
              <h4 className='text-sm font-black text-emerald-600 dark:text-emerald-400'>COMPLIANT</h4>
            </div>
            <Lock className='h-8 w-8 text-emerald-500 opacity-30' />
          </CardContent>
        </Card>

        <Card className='border-emerald-500/10 shadow-sm'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-0.5'>
              <span className='text-[10px] uppercase font-bold text-muted-foreground'>Multi-Factor (2FA)</span>
              <h4 className='text-sm font-black text-amber-600 dark:text-amber-400'>DISABLED</h4>
            </div>
            <ShieldX className='h-8 w-8 text-amber-500 opacity-30' />
          </CardContent>
        </Card>

        <Card className='border-emerald-500/10 shadow-sm bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/20'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-0.5'>
              <span className='text-[10px] uppercase font-bold text-muted-foreground'>Session Expires In</span>
              <h4 className='text-sm font-mono font-black text-primary animate-pulse'>{sessionTimeLeft}</h4>
            </div>
            <Hourglass className='h-8 w-8 text-emerald-600 dark:text-emerald-400 opacity-40' />
          </CardContent>
        </Card>
      </div>

      {/* 2. User Information Profile Card */}
      <Card className='border-emerald-500/10 shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-md font-bold flex items-center gap-2'>
            <User className='h-4 w-4 text-emerald-500' /> User Information & Active Profile
          </CardTitle>
          <CardDescription>Official personnel credentials from the system registry.</CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6 text-xs'>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-600 text-base border border-emerald-500/20'>
                {userProfile?.first_name[0]}{userProfile?.last_name[0]}
              </div>
              <div>
                <h4 className='font-bold text-sm text-foreground'>{userProfile?.name}</h4>
                <Badge className='bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[10px] py-0.5 font-bold mt-0.5'>
                  🔒 {userRole}
                </Badge>
              </div>
            </div>

            <div className='space-y-1.5 pt-3 border-t'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Mail className='h-3.5 w-3.5 text-emerald-500 shrink-0' /> {userProfile?.email}
              </div>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Phone className='h-3.5 w-3.5 text-emerald-500 shrink-0' /> {userProfile?.phone}
              </div>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Building className='h-3.5 w-3.5 text-emerald-500 shrink-0' /> {userProfile?.shelter}
              </div>
            </div>
          </div>

          <div className='space-y-2 pt-3 md:pt-0 md:border-l md:pl-6 border-t md:border-t-0 flex flex-col justify-center'>
            <div className='flex items-center justify-between py-1.5 border-b'>
              <span className='text-muted-foreground flex items-center gap-1.5'>
                <Clock className='h-3.5 w-3.5 text-emerald-500' /> Last Login Session:
              </span>
              <span className='font-mono font-bold text-foreground'>
                {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString() : 'First Session'}
              </span>
            </div>
            <div className='flex items-center justify-between py-1.5 border-b'>
              <span className='text-muted-foreground flex items-center gap-1.5'>
                <Shield className='h-3.5 w-3.5 text-emerald-500' /> Password Last Updated:
              </span>
              <span className='font-mono font-bold text-foreground'>
                {userProfile?.last_password_change ? new Date(userProfile.last_password_change).toLocaleString() : 'Default Credential'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* 3. Password Policy Checklist */}
        <div className='space-y-6'>
          <Card className='border-emerald-500/10 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
                🛡️ Password Security Policy
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2.5 text-xs'>
              <div className='flex items-center gap-2'>
                {hasMinLength ? <CheckCircle2 className='h-4 w-4 text-emerald-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
                <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                  At least 12 characters
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {hasUppercase ? <CheckCircle2 className='h-4 w-4 text-emerald-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
                <span className={hasUppercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                  One uppercase letter (A-Z)
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {hasLowercase ? <CheckCircle2 className='h-4 w-4 text-emerald-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
                <span className={hasLowercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                  One lowercase letter (a-z)
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {hasNumber ? <CheckCircle2 className='h-4 w-4 text-emerald-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
                <span className={hasNumber ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                  One number (0-9)
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {hasSpecial ? <CheckCircle2 className='h-4 w-4 text-emerald-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
                <span className={hasSpecial ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                  One special character (!@#$)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Role Permission Matrix Card */}
          <Card className='border-emerald-500/10 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
                🔑 Role Permissions Badge Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-xs'>
              {permissions.map((p, idx) => (
                <div key={idx} className='flex items-start gap-2.5 border-b pb-2 last:border-b-0 last:pb-0'>
                  {p.allowed}
                  <div className='space-y-0.5 leading-none'>
                    <span className='font-bold text-foreground block'>{p.name}</span>
                    <span className='text-[10px] text-muted-foreground'>{p.desc}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 4. Update Password Form */}
        <Card className='lg:col-span-2 border-emerald-500/10 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-md font-bold flex items-center gap-2'>
              <Lock className='h-4 w-4 text-emerald-500' /> Update Account Password
            </CardTitle>
            <CardDescription>Verify your current credentials and select a strong replacement password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordFormSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <span className='text-xs font-semibold text-foreground'>Current Password</span>
                <div className='relative'>
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder='Verify existing password'
                    className='pr-10 text-xs'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowCurrent(!showCurrent)}
                    className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground'
                  >
                    {showCurrent ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <span className='text-xs font-semibold text-foreground'>New Password</span>
                  <div className='relative'>
                    <Input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='At least 12 characters'
                      className='pr-10 text-xs'
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowNew(!showNew)}
                      className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground'
                    >
                      {showNew ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <span className='text-xs font-semibold text-foreground'>Confirm New Password</span>
                  <div className='relative'>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder='Re-type new password'
                      className='pr-10 text-xs'
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirm(!showConfirm)}
                      className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground'
                    >
                      {showConfirm ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className='space-y-1.5 pt-1.5 border-t'>
                  <div className='flex justify-between text-xs'>
                    <span className='text-muted-foreground'>Password Strength:</span>
                    <strong className={strength.textClass}>{strength.label}</strong>
                  </div>
                  <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                </div>
              )}

              <Button
                type='submit'
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9'
              >
                Save New Password & Secure Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 5. Recent Security Events */}
      <Card className='border-emerald-500/10 shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-bold flex items-center gap-2'>
            <History className='h-4 w-4 text-emerald-500' /> Recent Security Activity Trail
          </CardTitle>
          <CardDescription>Chronological sequence of login validations and credential modifications.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='border-t overflow-hidden rounded-b-xl'>
            {profileData?.securityEvents && profileData.securityEvents.length > 0 ? (
              <table className='w-full border-collapse text-left text-xs'>
                <thead>
                  <tr className='bg-muted/50 font-semibold text-muted-foreground border-b'>
                    <th className='p-3'>Event Description</th>
                    <th className='p-3'>Actor</th>
                    <th className='p-3 text-right'>Timestamp</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {profileData.securityEvents.map((e) => (
                    <tr key={e.id} className='hover:bg-muted/30'>
                      <td className='p-3 font-medium text-foreground'>{e.action}</td>
                      <td className='p-3 text-muted-foreground'>{e.user}</td>
                      <td className='p-3 text-right text-muted-foreground font-mono'>
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className='p-6 text-center text-muted-foreground text-xs italic border-t'>
                No recent security activity logged.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Session Termination Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className='max-w-md w-full'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-rose-600'>
              <AlertCircle className='h-5 w-5 animate-bounce' /> Session Termination Warning
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to update your security credentials?
            </DialogDescription>
          </DialogHeader>

          <div className='p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl space-y-1.5 text-xs leading-relaxed'>
            <p>
              <strong>⚠️ Active Session Invalidation Alert:</strong>
            </p>
            <p>
              Changing your password will immediately invalidate all active login sessions across all devices. You will be logged out and must sign back in using your new credentials.
            </p>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              className='bg-rose-600 hover:bg-rose-700 text-white font-bold'
              onClick={executePasswordChange}
              disabled={submitting}
            >
              {submitting ? 'Applying Changes...' : 'Confirm Reset & Log Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
