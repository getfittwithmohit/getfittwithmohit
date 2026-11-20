import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Keeps the Supabase login fresh on every page visit.
// Without this, the session was only refreshed inside the open browser tab,
// so a client who closed the app for a while could come back with an
// expired token and get bounced to the OTP screen.
// Page-level redirects stay in useAuthGuard; this file only refreshes cookies.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the access token if it has expired and writes the new cookies.
  // Never block the page on a failure here; the client-side guard handles it.
  try {
    await supabase.auth.getClaims()
  } catch {
    // ignore
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|m4a|wav|pdf|woff|woff2|ttf)$).*)',
  ],
}
