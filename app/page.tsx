import { redirect } from 'next/navigation'

// The bare URL goes to login; the login page forwards anyone already
// signed in straight to Home (or the coach dashboard).
export default function RootPage() {
  redirect('/login')
}
