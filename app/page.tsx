import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMyHousehold } from '@/app/actions/household'
import Dashboard from '@/components/dashboard'
import { HouseholdSetup } from '@/components/household-setup'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const membership = await getMyHousehold()
  if (!membership) return <HouseholdSetup name={session.user.name} />
  return <Dashboard />
}

export const metadata = {
  title: 'casal. — Finanças a dois',
  description: 'Organizem os gastos e planos da casa juntos.',
}
