import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMyHousehold, getExpenses, getSavingsGoals, getPayableBills } from '@/app/actions/household'
import Dashboard from '@/components/dashboard'
import { HouseholdSetup } from '@/components/household-setup'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const membership = await getMyHousehold()
  if (!membership) return <HouseholdSetup name={session.user.name} />
  const [expenses, savings, payableBills] = await Promise.all([getExpenses(), getSavingsGoals(), getPayableBills()])
  return (
    <Dashboard
      initialProfileName={session.user.name}
      initialHouseholdName={membership.household.name}
  initialAvatarImage={session.user.image ?? null}
  initialAccentColor={session.user.accentColor ?? '#c8f169'}
  initialTheme={session.user.theme === 'dark' ? 'dark' : 'light'}
      initialAccountCreatedAt={new Date(session.user.createdAt).toISOString()}
      initialExpenses={expenses.map((item) => ({ id: item.id, title: item.title, category: item.category, date: item.spentAt.toISOString(), amount: Number(item.amount), paidBy: item.createdBy === session.user.id ? session.user.name : 'Casa' }))}
      initialSavings={savings}
      initialPayableBills={payableBills}
    />
  )
}

export const metadata = {
  title: 'casal. — Finanças a dois',
  description: 'Organizem os gastos e planos da casa juntos.',
}
