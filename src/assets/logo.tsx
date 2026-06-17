import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      id='rescuehub-logo'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      className={cn('size-6 text-teal-600 dark:text-teal-400', className)}
      {...props}
    >
      <title>RescueHub Logo</title>
      <path d='M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3z' fill='currentColor' />
      <circle cx='8' cy='11.5' r='1.5' fill='currentColor' />
      <circle cx='10.5' cy='7.5' r='1.5' fill='currentColor' />
      <circle cx='13.5' cy='7.5' r='1.5' fill='currentColor' />
      <circle cx='16' cy='11.5' r='1.5' fill='currentColor' />
    </svg>
  )
}
