import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log('Middleware running for:', pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware user:', user?.email || 'not logged in')
  console.log('Pathname:', pathname)

  // Public routes — always accessible
  const publicRoutes = [
    '/login',
    '/coach/login',
    '/auth/callback',
  ]
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )
  if (isPublicRoute) return supabaseResponse

  // Client routes — require login
  const clientRoutes = [
    '/onboarding',
    '/identity',
    '/checkin',
    '/assessment',
    '/home',
    '/midjourney',
    '/pledge',
  ]
  const isClientRoute = clientRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Coach routes — require login
  const isCoachRoute = pathname.startsWith('/coach/dashboard')

  // Redirect to login if not authenticated
  if (!user && (isClientRoute || isCoachRoute)) {
    console.log('Redirecting to login — not authenticated')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check if coach
  const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL
  const isCoach = user?.email?.toLowerCase() === coachEmail?.toLowerCase()

  console.log('Is coach:', isCoach)

  // Redirect coach trying to access client routes to dashboard
  if (user && isCoach && isClientRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/coach/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect client trying to access coach dashboard
  if (user && !isCoach && isCoachRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}