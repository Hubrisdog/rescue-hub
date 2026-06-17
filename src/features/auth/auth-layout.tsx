import { Logo } from '@/assets/logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid h-svh max-w-none items-center justify-center bg-radial from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8'>
        <div className='mb-6 flex flex-col items-center justify-center gap-2'>
          <div className='p-3 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 shadow-inner shadow-teal-500/5'>
            <Logo className='size-10 text-teal-600 dark:text-teal-400' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-500 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent'>
            RescueHub
          </h1>
          <p className='text-xs text-muted-foreground font-medium uppercase tracking-widest'>
            Animal Welfare & Case Dispatcher
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
