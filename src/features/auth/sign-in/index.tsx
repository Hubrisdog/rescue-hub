import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-sm w-full gap-4 border-teal-500/10 shadow-2xl bg-card/80 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:shadow-teal-500/5 hover:border-teal-500/20'>
        {/* Ambient background glows */}
        <div className='absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute -bottom-8 -left-8 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none' />

        <CardHeader className='pb-4 relative z-10'>
          <CardTitle className='text-2xl font-bold tracking-tight text-foreground'>
            Welcome Back
          </CardTitle>
          <CardDescription className='text-sm text-muted-foreground mt-1.5'>
            Sign in to access the dispatcher workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className='relative z-10'>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter className='pb-6 relative z-10'>
          <p className='w-full text-center text-xs text-muted-foreground leading-relaxed'>
            By signing in, you agree to our{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary transition-colors'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary transition-colors'
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
