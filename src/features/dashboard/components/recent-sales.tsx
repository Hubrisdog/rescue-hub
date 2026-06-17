import { useRescueHubStore } from '@/stores/rescue-hub-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

export function RecentSales() {
  const activityLogs = useRescueHubStore((state) => state.activityLogs)

  // Show the latest 6 logs
  const latestLogs = activityLogs.slice(0, 6)

  const getInitials = (user: string) => {
    if (!user) return 'SYS'
    return user
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getEntityBadge = (type: string) => {
    switch (type) {
      case 'IncidentReport':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
      case 'RescueCase':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
      case 'Animal':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
      case 'Treatment':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
      case 'Rescuer':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
      default:
        return 'bg-slate-100 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className='space-y-6'>
      {latestLogs.length === 0 ? (
        <p className='text-sm text-muted-foreground text-center py-4'>
          No activities logged yet.
        </p>
      ) : (
        latestLogs.map((log) => {
          let timeAgo: string
          try {
            timeAgo = formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
          } catch {
            timeAgo = log.timestamp.split('T')[0]
          }

          return (
            <div key={log.id} className='flex items-start gap-4'>
              <Avatar className='h-9 w-9 border flex items-center justify-center font-bold text-xs'>
                <AvatarFallback className={getEntityBadge(log.entity_type)}>
                  {getInitials(log.user)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-1'>
                <p className='text-sm font-medium leading-tight text-foreground'>
                  {log.action}
                </p>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span className='font-semibold'>{log.user}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
