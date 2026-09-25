'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { createPayableBill, createSavingsGoal, deletePayableBill, deleteSavingsGoal, payNextInstallment, contributeToSavingsGoal, updateAppearance, updateHouseholdSettings, updateProfileAvatar } from '@/app/actions/household'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Camera,
  History,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  PiggyBank,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wallet,
  Users,
  X,
  Trash2,
} from 'lucide-react'

const expenses: Array<{ title: string; category: string; date: string; amount: number; icon: typeof Wallet; color: string }> = []

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type DashboardProps = {
  initialProfileName: string
  initialHouseholdName: string
  initialAvatarImage: string | null
  initialAccentColor: string
  initialTheme: 'light' | 'dark'
  initialAccountCreatedAt: string
  initialSavings: Array<{ id: number; name: string; targetAmount: number; installmentAmount: number; savedAmount: number; dueDay: number }>
  initialPayableBills: Array<{ id: number; person: string; title: string; totalAmount: number; installmentAmount: number; totalInstallments: number; paidInstallments: number; dueDay: number; status: string }>
}

export default function Page({ initialProfileName, initialHouseholdName, initialAvatarImage, initialAccentColor, initialTheme, initialAccountCreatedAt, initialSavings, initialPayableBills }: DashboardProps) {
  const accountCreatedAt = new Date(initialAccountCreatedAt)
  const currentDate = new Date()
  const monthsSinceAccountCreation = (currentDate.getFullYear() - accountCreatedAt.getFullYear()) * 12 + currentDate.getMonth() - accountCreatedAt.getMonth()
  const hasPreviousMonth = monthsSinceAccountCreation >= 1

  const [showInvite, setShowInvite] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Casa')
  const [expensePeople, setExpensePeople] = useState('2')
  const [expensePaidBy, setExpensePaidBy] = useState('Eu')
  const [profileName, setProfileName] = useState(initialProfileName)
  const [accountType, setAccountType] = useState<'single' | 'couple' | 'family'>('couple')
  const [groupNames, setGroupNames] = useState(initialHouseholdName)
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [avatarImage, setAvatarImage] = useState<string | null>(initialAvatarImage)
  const [expenseItems, setExpenseItems] = useState(expenses)
  const [expenseError, setExpenseError] = useState('')
  const [avatarColor, setAvatarColor] = useState('#f2c9a8')
  const [accentColor, setAccentColor] = useState(initialAccentColor)
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showGoal, setShowGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [expenseFilter, setExpenseFilter] = useState('Todas')
  const [expenseMonth, setExpenseMonth] = useState('current')
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(false)
  const [history, setHistory] = useState<Array<{ id: number; label: string; detail: string; time: string }>>([])
  const [members, setMembers] = useState([{ id: 1, name: profileName, role: 'Administrador' }])
  const [savings, setSavings] = useState(initialSavings)
  const [showSavings, setShowSavings] = useState(false)
  const [savingsName, setSavingsName] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')
  const [savingsInstallment, setSavingsInstallment] = useState('')
  const [savingsDueDay, setSavingsDueDay] = useState('5')
  const [savingsError, setSavingsError] = useState('')
  const [contributionGoalId, setContributionGoalId] = useState<number | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionError, setContributionError] = useState('')
  const [bills, setBills] = useState(initialPayableBills)
  const [showBill, setShowBill] = useState(false)
  const [billPerson, setBillPerson] = useState('')
  const [billTitle, setBillTitle] = useState('')
  const [billTotal, setBillTotal] = useState('')
  const [billInstallment, setBillInstallment] = useState('')
  const [billCount, setBillCount] = useState('1')
  const [billDueDay, setBillDueDay] = useState('5')
  const [billError, setBillError] = useState('')

  const avatarInitials = profileName.split(' ').filter(Boolean).slice(0, 2).map((name) => name[0]).join('').toUpperCase() || 'EU'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.style.setProperty('--accent-user', accentColor)
  }, [theme, accentColor])

  async function saveAppearance(nextColor = accentColor, nextTheme = theme) {
    setAppearanceSaving(true)
    try {
      await updateAppearance({ accentColor: nextColor, theme: nextTheme })
      setAccentColor(nextColor)
      setTheme(nextTheme)
    } finally {
      setAppearanceSaving(false)
    }
  }

  function goToTab(tab: string, target?: string) {
    setActiveTab(tab)
    setMobileMenu(false)
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addCustomCategory() {
    const category = newCategory.trim()
    if (!category || customCategories.includes(category)) return
    setCustomCategories((current) => [...current, category])
    setExpenseCategory(category)
    setNewCategory('')
  }

  function addExpense() {
    const amount = Number(expenseAmount.replace(',', '.'))
    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Informe uma descrição e um valor maior que zero.')
      return
    }
    setExpenseItems((current) => [{ title: expenseTitle.trim(), category: expenseCategory, date: `Agora · ${expensePaidBy} pagou`, amount, icon: Wallet, color: 'bg-emerald-100 text-emerald-700' }, ...current])
    setHistory((current) => [{ id: Date.now(), label: 'Novo gasto registrado', detail: `${expenseTitle.trim()} · ${formatCurrency(amount)}`, time: 'Agora' }, ...current])
    setExpenseTitle('')
    setExpenseAmount('')
    setExpenseError('')
    setShowExpense(false)
  }
  const router = useRouter()
  const total = useMemo(() => expenseItems.reduce((sum, item) => sum + item.amount, 0), [expenseItems])
  const visibleExpenses = useMemo(() => expenseItems.filter((item) => {
    const categoryMatches = expenseFilter === 'Todas' || item.category === expenseFilter
    if (expenseMonth === 'all') return categoryMatches
    const parsedDate = new Date(item.date)
    if (Number.isNaN(parsedDate.getTime())) return categoryMatches
    const monthOffset = expenseMonth === 'previous' ? -1 : 0
    const reference = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1)
    return categoryMatches && parsedDate.getFullYear() === reference.getFullYear() && parsedDate.getMonth() === reference.getMonth()
  }), [currentDate, expenseFilter, expenseItems, expenseMonth])
  const categoryTotals = useMemo(() => ['Casa', 'Alimentação', 'Transporte', 'Lazer', ...customCategories].map((category) => ({ category, total: expenseItems.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total), [customCategories, expenseItems])
  const topCategory = categoryTotals[0]
  const reservedTotal = savings.reduce((sum, item) => sum + item.installmentAmount / 100, 0)
  const billsTotal = bills.filter((bill) => bill.status === 'pending').reduce((sum, bill) => sum + bill.installmentAmount / 100, 0)
  const upcomingBills = bills.filter((bill) => bill.status !== 'paid' && bill.dueDay >= currentDate.getDate() && bill.dueDay <= currentDate.getDate() + 7)
  const budgetUsage = monthlyLimit ? ((total + reservedTotal + billsTotal) / Math.max(1, Number(monthlyLimit.replace(',', '.')))) * 100 : 0
  const alerts = [
    ...(upcomingBills.length ? [{ title: `${upcomingBills.length} conta${upcomingBills.length > 1 ? 's' : ''} vencendo em breve`, detail: upcomingBills.map((bill) => bill.title).join(', ') }] : []),
    ...(monthlyLimit && budgetUsage >= 80 ? [{ title: budgetUsage >= 100 ? 'Limite mensal ultrapassado' : 'Você está perto do limite mensal', detail: `${Math.round(budgetUsage)}% do limite já comprometido` }] : []),
  ]
  const availableBalance = Math.max(0, Number(monthlyLimit.replace(',', '.')) - total - reservedTotal - billsTotal)

  async function addContribution() {
    if (!contributionGoalId) return
    try {
      const updated = await contributeToSavingsGoal(contributionGoalId, Number(contributionAmount.replace(',', '.')))
      setSavings((current) => current.map((goal) => goal.id === updated.id ? updated : goal))
      setContributionGoalId(null)
      setContributionAmount('')
      setContributionError('')
    } catch {
      setContributionError('Informe um valor válido para o aporte.')
    }
  }

  async function addPayableBill() {
    try {
      const created = await createPayableBill({ person: billPerson, title: billTitle, totalAmount: Number(billTotal.replace(',', '.')), installmentAmount: Number(billInstallment.replace(',', '.')), totalInstallments: Number(billCount), dueDay: Number(billDueDay) })
      setBills((current) => [...current, created].sort((a, b) => a.dueDay - b.dueDay))
      setBillPerson(''); setBillTitle(''); setBillTotal(''); setBillInstallment(''); setBillCount('1'); setShowBill(false); setBillError('')
    } catch { setBillError('Preencha todos os dados da conta corretamente.') }
  }

  async function markBillPaid(id: number) {
    const updated = await payNextInstallment(id)
    setBills((current) => current.map((bill) => bill.id === id ? updated : bill))
    setHistory((current) => [{ id: Date.now(), label: 'Parcela marcada como paga', detail: updated.title, time: 'Agora' }, ...current])
  }

  async function addSavingsGoal() {
    try {
      const created = await createSavingsGoal({ name: savingsName, targetAmount: Number(savingsTarget.replace(',', '.')), installmentAmount: Number(savingsInstallment.replace(',', '.')), dueDay: Number(savingsDueDay) })
      setSavings((current) => [...current, created])
      setSavingsName(''); setSavingsTarget(''); setSavingsInstallment(''); setShowSavings(false); setSavingsError('')
    } catch { setSavingsError('Preencha os valores da reserva corretamente.') }
  }

  function addGoal() {
    if (!goalTitle.trim()) return
    setCustomGoals((current) => [...current, goalTitle.trim()])
    setGoalTitle('')
    setShowGoal(false)
  }

  async function enableBrowserNotifications() {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setBrowserNotifications(true)
      new Notification('Lembretes ativados', { body: 'Você receberá avisos sobre contas e reservas.' })
    }
  }

  function removeMember(id: number) {
    setMembers((current) => current.filter((member) => member.id !== id || member.role === 'Administrador'))
  }

  async function saveSettings() {
    try {
      const saved = await updateHouseholdSettings({ profileName, householdName: groupNames })
      setProfileName(saved.profileName)
      setGroupNames(saved.householdName)
      setSettingsSaved(true)
      window.setTimeout(() => setSettingsSaved(false), 2200)
    } catch {
      setSettingsSaved(false)
    }
  }

  async function handleAvatarFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setAvatarImage(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  async function saveAvatar() {
    setAvatarSaving(true)
    try {
      await updateProfileAvatar(avatarImage)
      setShowAvatarEditor(false)
    } finally {
      setAvatarSaving(false)
    }
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await authClient.signOut()
      router.push('/sign-in')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }
  const inviteLink = 'casal.app/entrar/8K4M2P'

  function copyInvite() {
    navigator.clipboard?.writeText(`https://${inviteLink}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function printReport() {
    window.print()
  }

  function exportExpenses() {
    const rows = expenseItems.map((item) => `<tr><td>${item.title}</td><td>${item.category}</td><td>${item.date}</td><td class="amount">${formatCurrency(item.amount)}</td></tr>`).join('')
    const table = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;color:#203f36}h1{font-size:20px}table{border-collapse:collapse;min-width:720px}th{background:#203f36;color:white;text-align:left}th,td{border:1px solid #dce4df;padding:10px 12px}tbody tr:nth-child(even){background:#f4f8f2}.amount{font-weight:bold;text-align:right}.total{font-weight:bold;background:#e7f3d6}</style></head><body><h1>Gastos da conta — ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h1><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="total"><td colspan="3">Total do mês</td><td class="amount">${formatCurrency(total)}</td></tr></tfoot></table></body></html>`
    const blob = new Blob([table], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'gastos-junho.xls'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <header className="sticky top-0 z-20 border-b border-[#e6e9ed] bg-[#f7f8fa]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:h-20 sm:px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#203f36] text-[#c8f169]"><Wallet size={20} strokeWidth={2.4} /></div>
            <div><p className="text-[17px] font-bold tracking-tight">casal.</p><p className="text-[10px] font-medium uppercase tracking-[0.19em] text-[#89918e]">finanças a dois</p></div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button onClick={() => setNotificationsEnabled((enabled) => !enabled)} className={`rounded-full p-2.5 transition hover:bg-white hover:text-[#203f36] ${notificationsEnabled ? 'text-[#203f36]' : 'text-[#b0b8b4]'}`} aria-label={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'} aria-pressed={notificationsEnabled}><Bell size={18} /></button>
            <div className="h-8 w-px bg-[#dfe3e1]" />
            <button onClick={() => setShowAvatarEditor(true)} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm" aria-label="Editar foto do perfil"><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-[#713d22]" style={{ backgroundColor: avatarColor }}>{avatarImage ? <img src={avatarImage} alt="Foto do perfil" className="h-full w-full object-cover" /> : avatarInitials}</span><span className="text-sm font-semibold">{groupNames}</span><ChevronDown size={15} className="text-[#99a09e]" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1320px]">
        <aside aria-label="Navegação principal" className={`${mobileMenu ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-30 w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-[#e6e9ed] bg-[#f7f8fa] p-5 pt-24 lg:static lg:flex lg:min-h-[calc(100vh-80px)] lg:w-60 lg:bg-transparent lg:p-8 lg:pt-10`}>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => goToTab('overview')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><LayoutDashboard size={18} /> Visão geral</button>
            <button onClick={() => goToTab('expenses', 'gastos')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'expenses' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><ArrowDownLeft size={18} /> Gastos</button>
            <button onClick={() => goToTab('goals', 'metas')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'goals' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><Sparkles size={18} /> Metas</button>
            <button onClick={() => goToTab('savings')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'savings' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><PiggyBank size={18} /> Reservas</button>
            <button onClick={() => goToTab('bills')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'bills' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><CalendarDays size={18} /> Contas a pagar</button>
            <button onClick={() => goToTab('calendar')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'calendar' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><CalendarDays size={18} /> Calendário</button>
            <button onClick={() => goToTab('reports')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'reports' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><ArrowUpRight size={18} /> Relatórios</button>
            <button onClick={() => goToTab('history')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'history' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><History size={18} /> Histórico</button>
            <button onClick={() => goToTab('members')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'members' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><Users size={18} /> Membros</button>
          </nav>
          <div className="my-8 h-px bg-[#e4e8e6]" />
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1a9a5]">Sua conta</p>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => setShowInvite(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] hover:bg-white"><Share2 size={18} /> Compartilhar conta</button>
            <button onClick={() => goToTab('settings')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'settings' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><Settings size={18} /> Configurações</button>
            <button onClick={handleSignOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] transition hover:bg-[#fff1ef] hover:text-[#a33c30] disabled:cursor-wait disabled:opacity-60"><LogOut size={18} /> {signingOut ? 'Saindo...' : 'Sair da conta'}</button>
          </nav>
          {hasPreviousMonth && <div className="mt-auto hidden rounded-2xl bg-[#e7f3d6] p-4 lg:block"><p className="mb-2 text-xs font-bold text-[#32513d]">Dica do mês</p><p className="text-xs leading-relaxed text-[#5d7561]">Vocês já economizaram comparado ao mês passado.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#c8dfaf]"><div className="h-full w-0 rounded-full bg-[#94bd53]" /></div></div>}
        </aside>
        <nav aria-label="Navegação rápida" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#e5e9e7] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_rgba(32,63,54,.08)] backdrop-blur lg:hidden"><button onClick={() => goToTab('overview')} className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${activeTab === 'overview' ? 'text-[var(--accent-user)]' : 'text-[#8a938f]'}`} aria-label="Visão geral"><LayoutDashboard size={18} />Início</button><button onClick={() => goToTab('expenses', 'gastos')} className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${activeTab === 'expenses' ? 'text-[var(--accent-user)]' : 'text-[#8a938f]'}`} aria-label="Gastos"><ArrowDownLeft size={18} />Gastos</button><button onClick={() => goToTab('goals', 'metas')} className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${activeTab === 'goals' ? 'text-[var(--accent-user)]' : 'text-[#8a938f]'}`} aria-label="Metas"><Sparkles size={18} />Metas</button><button onClick={() => goToTab('settings')} className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${activeTab === 'settings' ? 'text-[var(--accent-user)]' : 'text-[#8a938f]'}`} aria-label="Configurações"><Settings size={18} />Ajustes</button></nav>

        {activeTab === 'overview' && <section className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Bom dia, {profileName.split(' ')[0]}.</h1></div><button onClick={() => setShowExpense(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36] shadow-[0_5px_15px_rgba(141,183,61,.18)] transition hover:-translate-y-0.5"><Plus size={17} /> Adicionar gasto</button></div>

  {!monthlyLimit && !savings.length && !bills.length && <section className="mb-6 rounded-2xl border border-[#dce8c8] bg-[#f1f8e5] p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#557932]">Primeiros passos</div><h2 className="text-xl font-bold text-[#203f36]">Organize sua vida financeira</h2><p className="mt-1 max-w-xl text-sm text-[#617266]">Comece definindo seu limite mensal e registre o primeiro gasto. Você poderá acompanhar tudo com clareza.</p></div><button onClick={() => goToTab('settings')} className="shrink-0 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]">Configurar agora</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white/80 p-3 text-sm text-[#52645a]"><strong className="block text-[#203f36]">1. Limite mensal</strong><span className="text-xs">Defina quanto pode gastar.</span></div><div className="rounded-xl bg-white/80 p-3 text-sm text-[#52645a]"><strong className="block text-[#203f36]">2. Primeiro gasto</strong><span className="text-xs">Registre uma despesa.</span></div><div className="rounded-xl bg-white/80 p-3 text-sm text-[#52645a]"><strong className="block text-[#203f36]">3. Convide alguém</strong><span className="text-xs">Compartilhe sua conta.</span></div></div></section>}
  {notificationsEnabled && alerts.length > 0 && <section aria-label="Notificações importantes" className="mb-6 rounded-2xl border border-[#dce8c8] bg-[#f1f8e5] p-4 sm:p-5"><div className="flex items-start gap-3"><Bell className="mt-0.5 shrink-0 text-[var(--accent-user)]" size={19} /><div className="min-w-0"><h2 className="text-sm font-bold text-[#203f36]">Notificações importantes</h2><div className="mt-2 space-y-2">{alerts.map((alert) => <div key={alert.title}><p className="text-sm font-semibold text-[#35433d]">{alert.title}</p><p className="text-xs text-[#7c8881]">{alert.detail}</p></div>)}</div></div></div></section>}
  <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#203f36] p-4 sm:p-6 text-white shadow-[0_12px_30px_rgba(32,63,54,.13)] md:col-span-2"><div className="flex items-start justify-between"><div><p className="text-sm text-[#a8c0b2]">Total gasto em junho</p><p className="mt-2 text-4xl font-bold tracking-[-0.05em]">{formatCurrency(total)}</p></div><div className="rounded-xl bg-white/10 p-3 text-[#c8f169]"><Wallet size={22} /></div></div><div className="mt-7 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs text-[#a8c0b2]"><span className="flex items-center gap-1 text-[#c8f169]"><ArrowDownLeft size={13} /> 0%</span> vs. mês passado</div><div className="h-2 w-48 overflow-hidden rounded-full bg-white/15"><div className="h-full w-0 rounded-full bg-[#c8f169]" /></div></div><p className="text-right text-xs text-[#a8c0b2]">limite mensal<br /><strong className="text-sm text-white">{formatCurrency(Number(monthlyLimit.replace(',', '.')) || 0)}</strong></p></div></div>
            <div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-[#8a938f]">Saldo do mês</p><p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#203f36]">{formatCurrency(availableBalance)}</p></div><div className="rounded-xl bg-[#eaf5dd] p-3 text-[#719b37]"><ArrowDownLeft size={21} /></div></div><p className="mt-7 text-xs text-[#8a938f]">disponível depois de gastos, reservas e contas</p><div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]"><div className="rounded-lg bg-[#f8faf7] p-2"><span className="block text-[#8a938f]">Gastos</span><strong className="text-[#35433d]">{formatCurrency(total)}</strong></div><div className="rounded-lg bg-[#f8faf7] p-2"><span className="block text-[#8a938f]">Reservado</span><strong className="text-[#35433d]">{formatCurrency(reservedTotal)}</strong></div><div className="rounded-lg bg-[#f8faf7] p-2"><span className="block text-[#8a938f]">A pagar</span><strong className="text-[#35433d]">{formatCurrency(billsTotal)}</strong></div></div><div className="mt-2 flex justify-between text-xs font-semibold text-[#4d6256]"><span>{monthlyLimit ? `${Math.round(((total + reservedTotal + billsTotal) / Math.max(1, Number(monthlyLimit.replace(',', '.')))) * 100)}% usado` : 'Defina seu limite mensal'}</span><span>{monthlyLimit ? formatCurrency(Number(monthlyLimit.replace(',', '.'))) : 'Sem limite'}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full rounded-full bg-[#9bc65b]" style={{ width: `${monthlyLimit ? Math.min(100, Math.round(((total + reservedTotal + billsTotal) / Math.max(1, Number(monthlyLimit.replace(',', '.')))) * 100)) : 0}%` }} /></div></div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <section id="gastos" className="rounded-2xl border border-[#e5e9e7] bg-white p-5 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Últimos gastos</h2><p className="mt-1 text-xs text-[#8a938f]">Tudo o que foi registrado na conta</p></div><button onClick={() => goToTab('expenses')} className="text-xs font-bold text-[#789b40]">Ver todos</button></div>{expenseItems.length ? <div className="flex flex-col gap-2">{expenseItems.map((expense) => { const Icon = expense.icon; return <div key={expense.title} className="flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-[#f8faf7]"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${expense.color}`}><Icon size={18} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#35433d]">{expense.title}</p><p className="mt-0.5 text-xs text-[#9aa29e]">{expense.category} · {expense.date}</p></div></div><p className="shrink-0 text-sm font-bold text-[#35433d]">{formatCurrency(expense.amount)}</p></div> })}</div> : <div className="rounded-xl border border-dashed border-[#dce4df] bg-[#f8faf7] px-4 py-8 text-center"><Wallet className="mx-auto text-[#9bc65b]" size={28} /><p className="mt-3 text-sm font-semibold text-[#35433d]">Nenhum gasto registrado</p><p className="mt-1 text-xs text-[#8a938f]">Adicione seu primeiro gasto para começar a acompanhar a conta.</p><button onClick={() => setShowExpense(true)} className="mt-4 rounded-lg bg-[var(--accent-user)] px-3 py-2 text-xs font-bold text-[#203f36]">Adicionar primeiro gasto</button></div>}</section>
            <section id="metas" className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Metas do casal</h2><p className="mt-1 text-xs text-[#8a938f]">Construindo juntos</p></div><button onClick={() => { setActiveTab('goals'); setShowGoal(true) }} className="rounded-lg p-2 text-[#8a938f] hover:bg-[#f4f7f2]" aria-label="Adicionar meta"><Plus size={17} /></button></div>{savings.length ? <div className="space-y-5">{savings.map((goal) => <div key={goal.id} className="relative"><Goal label={goal.name} value={formatCurrency(goal.savedAmount / 100)} total={formatCurrency(goal.targetAmount / 100)} progress={`${Math.min(100, Math.round((goal.savedAmount / Math.max(1, goal.targetAmount)) * 100))}%`} color="bg-[#9bc65b]" /><button type="button" onClick={async () => { if (!window.confirm(`Excluir a meta ${goal.name}?`)) return; await deleteSavingsGoal(goal.id); setSavings((current) => current.filter((item) => item.id !== goal.id)) }} className="absolute right-0 top-0 rounded-lg p-2 text-[#8a938f] hover:bg-[#fff1ef] hover:text-red-600" aria-label={`Excluir meta ${goal.name}`}><Trash2 size={15} /></button></div>)}</div> : <div className="py-8 text-center text-sm text-[#8a938f]">Nenhuma meta cadastrada ainda.</div>}</section>
          </div>
        </section>}

        {activeTab === 'expenses' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12">
          <div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Movimentações da conta</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Gastos</h1><p className="mt-2 text-sm text-[#7c8881]">Acompanhe e organize todas as despesas do mês.</p></div><button onClick={() => setShowExpense(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]"><Plus size={17} /> Adicionar gasto</button></div>
          <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-[#203f36] p-4 sm:p-6 text-white"><p className="text-sm text-[#a8c0b2]">Total no período</p><p className="mt-2 text-3xl font-bold">{formatCurrency(visibleExpenses.reduce((sum, item) => sum + item.amount, 0))}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><p className="text-sm text-[#8a938f]">Quantidade</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{visibleExpenses.length}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><p className="text-sm text-[#8a938f]">Média por gasto</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{formatCurrency(visibleExpenses.length ? visibleExpenses.reduce((sum, item) => sum + item.amount, 0) / visibleExpenses.length : 0)}</p></div></div>
          <div className="mt-8 rounded-2xl border border-[#e5e9e7] bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-lg font-bold text-[#203f36]">Todos os gastos</h2><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs font-semibold text-[#7c8881]">Período<select aria-label="Filtrar por período" value={expenseMonth} onChange={(event) => setExpenseMonth(event.target.value)} className="rounded-lg border border-[#dce4df] bg-white px-2 py-1.5 text-xs text-[#35433d]"><option value="current">Mês atual</option><option value="previous">Mês anterior</option><option value="all">Todos os períodos</option></select></label><label className="flex items-center gap-2 text-xs font-semibold text-[#7c8881]">Categoria<select value={expenseFilter} onChange={(event) => setExpenseFilter(event.target.value)} className="rounded-lg border border-[#dce4df] bg-white px-2 py-1.5 text-xs text-[#35433d]"><option>Todas</option><option>Casa</option><option>Alimentação</option><option>Transporte</option><option>Lazer</option>{customCategories.map((category) => <option key={category}>{category}</option>)}</select></label></div><div className="mt-5 flex flex-col gap-2">{visibleExpenses.length ? visibleExpenses.map((expense) => { const Icon = expense.icon; return <div key={expense.title} className="flex items-center justify-between rounded-xl px-2 py-3 hover:bg-[#f8faf7]"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${expense.color}`}><Icon size={18} /></div><div><p className="text-sm font-semibold text-[#35433d]">{expense.title}</p><p className="text-xs text-[#9aa29e]">{expense.category} · {expense.date}</p></div></div><p className="text-sm font-bold text-[#35433d]">{formatCurrency(expense.amount)}</p></div> }) : <div className="rounded-xl border border-dashed border-[#dce4df] px-4 py-8 text-center text-sm text-[#8a938f]">Nenhum gasto encontrado nessa categoria.</div>}</div>        </div></div>
        </section>}

        {activeTab === 'calendar' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Planejamento mensal</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Calendário</h1><p className="mt-2 text-sm text-[#7c8881]">Visualize vencimentos, contas recorrentes e lembretes.</p></div><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#203f36]">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p><p className="mt-1 text-xs text-[#8a938f]">Nenhuma conta planejada ainda</p></div><button onClick={() => setShowExpense(true)} className="flex items-center gap-2 rounded-xl bg-[#c8f169] px-3 py-2 text-xs font-bold text-[#203f36]"><Plus size={15} /> Lançar conta</button></div><div className="grid grid-cols-7 gap-2 text-center text-xs"><div className="col-span-7 grid grid-cols-7 pb-2 font-bold text-[#9aa29e]">{['D','S','T','Q','Q','S','S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>{Array.from({ length: 30 }, (_, index) => { const day = index + 1; const highlighted = bills.some((bill) => bill.dueDay === day) || savings.some((saving) => saving.dueDay === day); return <button key={day} type="button" onClick={() => setSelectedDay(day)} aria-label={`Selecionar dia ${day}`} className={`relative rounded-xl p-3 font-semibold transition hover:bg-[#f1f8e6] ${day === selectedDay ? 'bg-[#203f36] text-white' : 'text-[#53635a]'}`}>{day}{highlighted && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${day === selectedDay ? 'bg-[#c8f169]' : 'bg-[#9bc65b]'}`} />}</button> })}</div></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><h2 className="text-lg font-bold text-[#203f36]">Próximos lembretes</h2><p className="mt-1 text-xs text-[#8a938f]">{selectedDay ? `Dia selecionado: ${selectedDay}` : 'Selecione uma data para ver os lembretes'} de junho</p><div className="mt-5 space-y-3"><Reminder title="Nenhuma conta cadastrada" date="Dia 05" amount="R$ 0,00"/><Reminder title="Cadastre um lembrete" date="Dia 10" amount="R$ 0,00"/><Reminder title="Cartão de cr��dito" date="Dia 15" amount="R$ 0,00"/></div><button className="mt-5 w-full rounded-xl border border-[#dce4df] py-3 text-sm font-bold text-[#52645a] hover:bg-[#f8faf7]">Gerenciar lembretes</button></div></div></section>}

        {activeTab === 'history' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Transparência financeira</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Histórico</h1><p className="mt-2 text-sm text-[#7c8881]">Veja as últimas movimentações feitas na conta.</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6">{history.length ? <div className="space-y-2">{history.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-4 py-4"><div><p className="text-sm font-bold text-[#203f36]">{item.label}</p><p className="mt-1 text-xs text-[#7c8881]">{item.detail}</p></div><span className="text-xs text-[#9aa29e]">{item.time}</span></div>)}</div> : <div className="py-10 text-center"><History className="mx-auto text-[#9bc65b]" size={30} /><p className="mt-3 font-semibold text-[#203f36]">Nenhuma alteração nesta sessão</p><p className="mt-1 text-sm text-[#8a938f]">Novos gastos e pagamentos aparecerão aqui.</p></div>}</div></section>}

  {activeTab === 'reports' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Análise da conta</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Relatórios</h1><p className="mt-2 text-sm text-[#7c8881]">Entendam para onde o dinheiro está indo.</p></div><div className="flex flex-wrap gap-2"><button onClick={printReport} className="rounded-xl border border-[#dce4df] bg-white px-4 py-3 text-sm font-bold text-[#52645a]">Imprimir relatório</button><button onClick={exportExpenses} className="rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]">Exportar Excel</button></div></div><div className="grid gap-3 sm:gap-4 md:grid-cols-3">{['Casa', 'Alimentação', 'Transporte'].map((category, index) => { const categoryTotal = expenseItems.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0); const percent = total > 0 ? Math.round((categoryTotal / total) * 100) : 0; return <Stat key={category} label={category} value={formatCurrency(categoryTotal)} percent={`${percent}%`} color={['bg-[#7ea8a0]', 'bg-[#e7a65b]', 'bg-[#9bc65b]'][index]} /> })}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-[#203f36]">Resumo do mês</h2><p className="mt-1 text-xs text-[#8a938f]">Uma leitura rápida dos seus dados atuais.</p></div><span className="rounded-full bg-[#e7f3d6] px-3 py-1 text-xs font-bold text-[#557932]">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f8faf7] p-4"><p className="text-xs text-[#8a938f]">Total gasto</p><p className="mt-1 text-lg font-bold text-[#203f36]">{formatCurrency(total)}</p></div><div className="rounded-xl bg-[#f8faf7] p-4"><p className="text-xs text-[#8a938f]">Maior categoria</p><p className="mt-1 truncate text-lg font-bold text-[#203f36]">{topCategory?.category ?? 'Nenhuma'}</p></div></div><div className="mt-5 rounded-xl border border-dashed border-[#dce4df] px-4 py-5 text-center"><p className="text-sm font-semibold text-[#35433d]">{expenseItems.length ? 'Continue registrando seus gastos' : 'Ainda não há dados para comparar'}</p><p className="mt-1 text-xs text-[#8a938f]">Quando houver mais de um mês, você verá a evolução aqui.</p></div></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><h2 className="text-lg font-bold text-[#203f36]">Distribuição</h2><p className="mt-1 text-xs text-[#8a938f]">Gastos por categoria</p>{categoryTotals.length ? <div className="mt-6 flex flex-col gap-4">{categoryTotals.map((item, index) => <div key={item.category}><div className="mb-1 flex justify-between text-xs font-semibold text-[#52645a]"><span>{item.category}</span><span>{formatCurrency(item.total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className={`h-full rounded-full ${['bg-[#7ea8a0]', 'bg-[#e7a65b]', 'bg-[#9bc65b]', 'bg-[#b68ac5]'][index % 4]}`} style={{ width: `${Math.max(6, Math.round((item.total / total) * 100))}%` }} /></div></div>)}</div> : <div className="py-10 text-center text-sm text-[#8a938f]">Nenhum gasto registrado para analisar.</div>}</div></div><div className="mt-6 rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><h2 className="text-lg font-bold text-[#203f36]">Divisão por categoria</h2><div className="mt-6 space-y-5">{['Casa', 'Alimentação', 'Transporte', 'Lazer'].map((category, index) => { const categoryTotal = expenseItems.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0); const percent = total > 0 ? Math.round((categoryTotal / total) * 100) : 0; return <ReportBar key={category} label={category} value={formatCurrency(categoryTotal)} percent={`${percent}%`} color={['bg-[#7ea8a0]', 'bg-[#e7a65b]', 'bg-[#9bc65b]', 'bg-[#b68ac5]'][index]} /> })}</div></div></section>}

        {activeTab === 'bills' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Compromissos financeiros</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Contas a pagar</h1><p className="mt-2 text-sm text-[#7c8881]">Acompanhe parcelas, vencimentos e o que ainda falta pagar.</p></div><button onClick={() => setShowBill(true)} className="flex items-center gap-2 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]"><Plus size={17} /> Nova conta</button></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-[#203f36] p-4 sm:p-6 text-white"><p className="text-sm text-[#a8c0b2]">Próximas parcelas</p><p className="mt-2 text-3xl font-bold">{formatCurrency(bills.filter((bill) => bill.status === 'pending').reduce((sum, bill) => sum + bill.installmentAmount / 100, 0))}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><p className="text-sm text-[#8a938f]">Em aberto</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{bills.filter((bill) => bill.status === 'pending').length}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><p className="text-sm text-[#8a938f]">Vencimentos</p><p className="mt-2 text-3xl font-bold text-[#203f36]">Todo mês</p></div></div><div className="mt-8 space-y-3">{bills.map((bill) => <div key={bill.id} className="flex flex-col gap-4 rounded-2xl border border-[#e5e9e7] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-bold text-[#203f36]">{bill.title}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${bill.status === 'paid' ? 'bg-[#e7f3d6] text-[#557932]' : 'bg-[#fff1df] text-[#9a672d]'}`}>{bill.status === 'paid' ? 'Pago' : 'Pendente'}</span></div><p className="mt-1 text-sm text-[#7c8881]">Para {bill.person} · vence todo dia {bill.dueDay}</p><p className="mt-2 text-xs text-[#8a938f]">Parcela {Math.min(bill.paidInstallments + 1, bill.totalInstallments)} de {bill.totalInstallments}</p></div><div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-right"><p className="font-bold text-[#203f36]">{formatCurrency(bill.installmentAmount / 100)}</p><p className="text-xs text-[#8a938f]">de {formatCurrency(bill.totalAmount / 100)}</p></div>{bill.status !== 'paid' && <button onClick={() => markBillPaid(bill.id)} className="rounded-xl bg-[#203f36] px-3 py-2 text-xs font-bold text-white">Marcar parcela paga</button>}</div></div>)}</div></section>}

        {activeTab === 'savings' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Dinheiro com propósito</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Reservas programadas</h1><p className="mt-2 max-w-xl text-sm text-[#7c8881]">Uma parcela que parece uma conta, mas vira dinheiro guardado para um objetivo.</p></div><button onClick={() => setShowSavings(true)} className="flex items-center gap-2 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]"><Plus size={17} /> Nova reserva</button></div><div className="grid gap-3 sm:gap-4 md:grid-cols-3"><div className="rounded-2xl bg-[#203f36] p-4 sm:p-6 text-white"><p className="text-sm text-[#a8c0b2]">Total guardado</p><p className="mt-2 text-3xl font-bold">{formatCurrency(savings.reduce((sum, item) => sum + item.savedAmount / 100, 0))}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><p className="text-sm text-[#8a938f]">Parcelas mensais</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{formatCurrency(savings.reduce((sum, item) => sum + item.installmentAmount / 100, 0))}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><p className="text-sm text-[#8a938f]">Objetivos ativos</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{savings.length}</p></div></div><div className="mt-8 grid gap-4 md:grid-cols-2">{savings.map((item) => { const progress = Math.min(100, Math.round((item.savedAmount / Math.max(1, item.targetAmount)) * 100)); return <div key={item.id} className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold text-[#203f36]">{item.name}</h2><p className="mt-1 text-xs text-[#8a938f]">Guardar todo dia {item.dueDay}</p></div><span className="rounded-full bg-[#e7f3d6] px-3 py-1 text-xs font-bold text-[#557932]">{progress}%</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full rounded-full bg-[#9bc65b]" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex justify-between text-sm"><span className="font-bold text-[#203f36]">{formatCurrency(item.savedAmount / 100)}</span><span className="text-[#8a938f]">meta {formatCurrency(item.targetAmount / 100)}</span></div><p className="mt-3 text-xs text-[#6d7b72]">Parcela mensal: <strong>{formatCurrency(item.installmentAmount / 100)}</strong></p><button onClick={() => setContributionGoalId(item.id)} className="mt-4 w-full rounded-xl border border-[#cbdac4] py-2.5 text-xs font-bold text-[#557932] hover:bg-[#f5faed]">Registrar aporte</button></div> })}</div></section>}

        {activeTab === 'goals' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Planos para o futuro</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Metas</h1><p className="mt-2 text-sm text-[#7c8881]">Acompanhem cada conquista juntos.</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Metas do casal</h2><p className="mt-1 text-xs text-[#8a938f]">Construindo juntos</p></div><button className="flex items-center gap-2 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]" onClick={() => setShowGoal(true)}><Plus size={17} /> Nova meta</button></div><div className="grid gap-8 md:grid-cols-2">{savings.length ? savings.map((goal) => <Goal key={goal.id} label={goal.name} value={formatCurrency(goal.savedAmount / 100)} total={formatCurrency(goal.targetAmount / 100)} progress={`${Math.min(100, Math.round((goal.savedAmount / Math.max(1, goal.targetAmount)) * 100))}%`} color="bg-[#9bc65b]" />) : <div className="py-8 text-center text-sm text-[#8a938f] md:col-span-2">Nenhuma meta cadastrada ainda.</div>}{customGoals.map((label) => <Goal key={label} label={label} value="R$ 0" total="Defina um alvo" progress="0%" color="bg-[#9bc65b]"/>)}</div></div></section>}

        {activeTab === 'settings' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-6 max-w-4xl rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="mb-5"><h2 className="text-lg font-bold text-[#203f36]">Aparência</h2><p className="mt-1 text-sm text-[#7c8881]">Escolha a cor principal e o tema que você prefere usar.</p></div><div className="grid gap-6 sm:grid-cols-2"><div><p className="mb-3 text-sm font-semibold text-[#435149]">Cor do destaque</p><div className="flex flex-wrap gap-3">{['#c8f169', '#8ecae6', '#ff8fab', '#ffb4a2', '#cdb4db', '#f6bd60', '#90be6d', '#74c69d', '#48cae4', '#f28482', '#b8b8ff', '#e9c46a'].map((color) => <button key={color} type="button" onClick={() => saveAppearance(color)} disabled={appearanceSaving} className={`size-10 rounded-full border-4 border-white shadow ring-1 ring-[#dfe6e1] transition hover:scale-105 disabled:opacity-60 ${accentColor === color ? 'outline outline-2 outline-offset-2 outline-[#203f36]' : ''}`} style={{ backgroundColor: color }} aria-label={`Usar cor ${color}`} aria-pressed={accentColor === color} />)}</div></div><div><p className="mb-3 text-sm font-semibold text-[#435149]">Tema</p><div className="flex gap-2"><button type="button" onClick={() => saveAppearance(accentColor, 'light')} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${theme === 'light' ? 'border-[#8eaf55] bg-[#e7f3d6] text-[#32513d]' : 'border-[#dfe6e1] text-[#7c8881]'}`}>Claro</button><button type="button" onClick={() => saveAppearance(accentColor, 'dark')} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${theme === 'dark' ? 'border-[#8eaf55] bg-[#203f36] text-white' : 'border-[#dfe6e1] text-[#7c8881]'}`}>Escuro</button></div></div></div></div><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Preferências da sua conta</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Configurações</h1><p className="mt-2 text-sm text-[#7c8881]">Atualize seus dados e a forma como vocês organizam as finanças.</p></div><div className="mb-6 max-w-4xl rounded-2xl border border-[#dce8c8] bg-[#f1f8e6] p-5"><div className="flex items-start gap-3"><Bell className="mt-0.5 text-[#668c35]" size={20} /><div className="flex-1"><h2 className="font-bold text-[#315238]">Lembretes de vencimento</h2><p className="mt-1 text-sm text-[#557932]">Receba avisos antes e no dia das suas parcelas e reservas.</p></div><button onClick={enableBrowserNotifications} className="rounded-xl bg-[#203f36] px-3 py-2 text-xs font-bold text-white">{browserNotifications ? 'Ativados' : 'Ativar avisos'}</button></div></div><div className="grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><h2 className="text-lg font-bold text-[#203f36]">Perfil</h2><p className="mt-1 text-sm text-[#8a938f]">Essas informações aparecem para quem compartilha a conta.</p><div className="mt-6 space-y-5"><label className="block text-sm font-semibold text-[#35433d]">Seu nome<input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" /></label><fieldset><legend className="text-sm font-semibold text-[#35433d]">Como vocês organizam a conta?</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{([{ value: 'single', label: 'Solteiro', description: 'Só eu' }, { value: 'couple', label: 'Casal', description: 'Duas pessoas' }, { value: 'family', label: 'Família', description: 'Várias pessoas' }] as const).map((option) => <button key={option.value} type="button" onClick={() => setAccountType(option.value)} className={`rounded-xl border px-3 py-3 text-left transition ${accountType === option.value ? 'border-[#8fb64f] bg-[#f1f8e6] text-[#315238]' : 'border-[#dce4df] text-[#6f7d74] hover:bg-[#f8faf7]'}`}><span className="block text-sm font-bold">{option.label}</span><span className="mt-1 block text-xs">{option.description}</span></button>)}</div></fieldset><label className="block text-sm font-semibold text-[#35433d]">{accountType === 'single' ? 'Seu nome completo' : accountType === 'couple' ? 'Nome do casal' : 'Nomes das pessoas da família'}<input value={groupNames} onChange={(event) => setGroupNames(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder={accountType === 'family' ? 'Ex.: Marina, Rafael e Sofia' : accountType === 'couple' ? 'Ex.: Marina & Rafael' : 'Ex.: Marina'} /></label><label className="block text-sm font-semibold text-[#35433d]">Limite mensal<input value={monthlyLimit} onChange={(event) => setMonthlyLimit(event.target.value)} type="number" min="0" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" /></label><button onClick={saveSettings} className="rounded-xl bg-[#203f36] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2d5549]">{settingsSaved ? 'Alterações salvas' : 'Salvar alterações'}</button></div></div><div className="space-y-6"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><h2 className="text-lg font-bold text-[#203f36]">Conta compartilhada</h2><p className="mt-1 text-sm text-[#8a938f]">Marina & Rafael</p><button onClick={() => setShowInvite(true)} className="mt-5 flex items-center gap-2 rounded-xl border border-[#cbdac4] px-4 py-3 text-sm font-bold text-[#496344] hover:bg-[#f5faed]"><Share2 size={16} /> Gerenciar convite</button></div><div className="rounded-2xl border border-[#f0d6d1] bg-[#fff8f6] p-6"><h2 className="text-lg font-bold text-[#8f3f35]">Zona de segurança</h2><p className="mt-1 text-sm leading-relaxed text-[#a56d65]">Para encerrar a sessão atual, use o botão abaixo.</p><button onClick={handleSignOut} className="mt-5 flex items-center gap-2 rounded-xl border border-[#e7b7b0] px-4 py-3 text-sm font-bold text-[#a33c30] hover:bg-white"><LogOut size={16} /> Sair da conta</button></div></div></div></section>}
      </div>

      {activeTab === 'members' && <section className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-12"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Conta compartilhada</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Membros</h1><p className="mt-2 text-sm text-[#7c8881]">Controle quem participa da organização financeira.</p></div><button onClick={() => setShowInvite(true)} className="flex items-center gap-2 rounded-xl bg-[var(--accent-user)] px-4 py-3 text-sm font-bold text-[#203f36]"><Share2 size={17} /> Convidar pessoa</button></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-4 sm:p-6"><div className="space-y-3">{members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2c9a8] text-xs font-bold text-[#713d22]">{member.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><p className="font-bold text-[#35433d]">{member.name}</p><p className="text-xs text-[#8a938f]">{member.role}</p></div></div>{member.role !== 'Administrador' && <button onClick={() => removeMember(member.id)} className="text-xs font-bold text-[#a33c30] hover:underline">Remover acesso</button>}</div>)}</div><p className="mt-5 rounded-xl bg-[#f1f8e6] px-4 py-3 text-xs leading-relaxed text-[#557932]">Administradores podem convidar pessoas e remover acessos. O histórico financeiro permanece visível para todos os membros.</p></div></section>}

      {showAvatarEditor && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowAvatarEditor(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="flex flex-col items-center text-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-[#713d22]" style={{ backgroundColor: avatarColor }}>{avatarImage ? <img src={avatarImage} alt="Prévia da foto do perfil" className="h-full w-full object-cover" /> : avatarInitials}</div><h2 className="mt-5 text-xl font-bold text-[#203f36]">Personalizar perfil</h2><p className="mt-2 text-sm text-[#7c8881]">Escolha uma foto ou uma cor para o seu avatar.</p><label className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-[#203f36] px-4 py-3 text-sm font-bold text-white hover:bg-[#2d5549]"><Camera size={17} /> Escolher foto<input type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" /></label><div className="mt-5 flex gap-3" aria-label="Cores do avatar">{['#f2c9a8', '#c8f169', '#b9d9d0', '#d8b4e2', '#f5c2c7'].map((color) => <button key={color} type="button" onClick={() => { setAvatarColor(color); setAvatarImage(null) }} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-[#dce4df]" style={{ backgroundColor: color }} aria-label={`Usar cor ${color}`}>{avatarColor === color && !avatarImage && <Check size={16} className="text-[#203f36]" />}</button>)}</div><button onClick={saveAvatar} disabled={avatarSaving} className="mt-6 w-full rounded-xl border border-[#dce4df] py-3 text-sm font-bold text-[#203f36] hover:bg-[#f8faf7] disabled:opacity-60">{avatarSaving ? 'Salvando...' : 'Salvar avatar'}</button></div></div></div>}

      {contributionGoalId !== null && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setContributionGoalId(null)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f]" aria-label="Fechar"><X size={18} /></button><h2 className="text-2xl font-bold text-[#203f36]">Registrar aporte</h2><p className="mt-2 text-sm text-[#7c8881]">Adicione dinheiro guardado a esta reserva.</p><label className="mt-6 block text-sm font-semibold text-[#35433d]">Valor do aporte<input autoFocus value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" placeholder="100,00" /></label>{contributionError && <p className="mt-2 text-sm text-[#a33c30]">{contributionError}</p>}<button onClick={addContribution} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white">Confirmar aporte</button></div></div>}

      {showBill && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowBill(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f]" aria-label="Fechar"><X size={18} /></button><h2 className="text-2xl font-bold text-[#203f36]">Nova conta a pagar</h2><p className="mt-2 text-sm text-[#7c8881]">Cadastre uma dívida, parcela ou compromisso mensal.</p><div className="mt-6 space-y-4"><label className="block text-sm font-semibold text-[#35433d]">Pessoa ou empresa<input value={billPerson} onChange={(event) => setBillPerson(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" placeholder="Ex.: João ou Banco" /></label><label className="block text-sm font-semibold text-[#35433d]">Descrição<input value={billTitle} onChange={(event) => setBillTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" placeholder="Ex.: Empréstimo" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#35433d]">Valor total<input value={billTotal} onChange={(event) => setBillTotal(event.target.value)} type="number" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" /></label><label className="block text-sm font-semibold text-[#35433d]">Valor da parcela<input value={billInstallment} onChange={(event) => setBillInstallment(event.target.value)} type="number" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#35433d]">Número de parcelas<input value={billCount} onChange={(event) => setBillCount(event.target.value)} type="number" min="1" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" /></label><label className="block text-sm font-semibold text-[#35433d]">Vence todo dia<input value={billDueDay} onChange={(event) => setBillDueDay(event.target.value)} type="number" min="1" max="31" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" /></label></div>{billError && <p className="text-sm text-[#a33c30]">{billError}</p>}</div><button onClick={addPayableBill} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white">Salvar conta</button></div></div>}

      {showSavings && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowSavings(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><PiggyBank size={22} /></div><h2 className="text-2xl font-bold text-[#203f36]">Criar reserva programada</h2><p className="mt-2 text-sm text-[#7c8881]">Defina uma parcela mensal. Ela fica registrada como compromisso e aumenta o dinheiro guardado.</p><div className="mt-6 space-y-4"><label className="block text-sm font-semibold text-[#35433d]">Objetivo<input value={savingsName} onChange={(event) => setSavingsName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="Ex.: Viagem, carro ou emergência" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#35433d]">Meta total<input value={savingsTarget} onChange={(event) => setSavingsTarget(event.target.value)} type="number" min="0.01" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="5.000,00" /></label><label className="block text-sm font-semibold text-[#35433d]">Parcela mensal<input value={savingsInstallment} onChange={(event) => setSavingsInstallment(event.target.value)} type="number" min="0.01" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="500,00" /></label></div><label className="block text-sm font-semibold text-[#35433d]">Lembrar todo mês no dia<input value={savingsDueDay} onChange={(event) => setSavingsDueDay(event.target.value)} type="number" min="1" max="31" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" /></label>{savingsError && <p className="text-sm text-[#a33c30]">{savingsError}</p>}</div><button onClick={addSavingsGoal} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white hover:bg-[#2d5549]">Criar reserva</button></div></div>}

      {showGoal && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowGoal(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Sparkles size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Criar meta</h2><p className="mt-2 text-sm text-[#7c8881]">Escolham algo para conquistar juntos.</p><label className="mt-6 block text-sm font-semibold text-[#35433d]">Nome da meta<input autoFocus value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) addGoal() }} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="Ex.: Viagem de férias" /></label><button onClick={addGoal} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white hover:bg-[#2d5549]">Salvar meta</button></div></div>}

      {showExpense && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowExpense(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Plus size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Adicionar gasto</h2><p className="mt-2 text-sm text-[#7c8881]">Registre uma despesa para a conta compartilhada.</p><div className="mt-6 space-y-4"><label className="block text-sm font-semibold text-[#35433d]">Descrição<input value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="Ex.: Mercado do mês" /></label><label className="block text-sm font-semibold text-[#35433d]">Valor<input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="0,00" /></label><label className="block text-sm font-semibold text-[#35433d]">Categoria<select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] bg-white px-4 py-3 outline-none focus:border-[#9bc65b]"><option>Casa</option><option>Alimentação</option><option>Transporte</option><option>Lazer</option>{customCategories.map((category) => <option key={category}>{category}</option>)}</select></label><div className="flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); addCustomCategory() } }} className="min-w-0 flex-1 rounded-xl border border-[#dce4df] px-3 py-2 text-xs" placeholder="Criar categoria personalizada" /><button type="button" onClick={addCustomCategory} className="rounded-xl border border-[#cbdac4] px-3 text-xs font-bold text-[#557932]">Adicionar</button></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#35433d]">Quem pagou<select value={expensePaidBy} onChange={(event) => setExpensePaidBy(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] bg-white px-4 py-3"><option>Eu</option><option>Outra pessoa</option><option>Dividido</option></select></label><label className="block text-sm font-semibold text-[#35433d]">Dividir entre<input value={expensePeople} onChange={(event) => setExpensePeople(event.target.value)} type="number" min="1" max="20" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3" /></label></div>{expenseAmount && Number(expensePeople) > 1 && <p className="rounded-xl bg-[#f1f8e6] px-3 py-2 text-xs font-semibold text-[#557932]">Cada pessoa fica responsável por {formatCurrency(Number(expenseAmount.replace(',', '.')) / Number(expensePeople))}</p>}</div><button onClick={addExpense} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white transition hover:bg-[#2d5549]">Salvar gasto</button></div></div>}

      {showInvite && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowInvite(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Share2 size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Convide alguém para a conta</h2><p className="mt-2 text-sm leading-relaxed text-[#7c8881]">Compartilhe este link com sua namorada ou com quem participa dos gastos. Só entra quem tiver o convite.</p><div className="mt-6 rounded-2xl border border-dashed border-[#bdd397] bg-[#f5faed] p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#789b40]">Link de convite</p><p className="break-all text-sm font-bold text-[#375033]">https://{inviteLink}</p></div><button onClick={copyInvite} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white transition hover:bg-[#2d5549]"><Copy size={16} /> {copied ? 'Link copiado' : 'Copiar link'}</button><p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#98a19c]"><CircleHelp size={13} /> O convite expira em 7 dias</p></div></div>}
    </main>
  )
}

function Reminder({ title, date, amount }: { title: string; date: string; amount: string }) {
  return <div className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-3 py-3"><div><p className="text-sm font-semibold text-[#435149]">{title}</p><p className="mt-1 text-xs text-[#9aa29e]">{date}</p></div><p className="text-sm font-bold text-[#52645a]">{amount}</p></div>
}

function Stat({ label, value, percent, color }: { label: string; value: string; percent: string; color: string }) {
  return <div className="rounded-2xl border border-[#e5e9e7] bg-white p-5"><p className="text-sm text-[#8a938f]">{label}</p><p className="mt-2 text-xl font-bold text-[#203f36]">{value}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className={`h-full rounded-full ${color}`} style={{ width: percent }} /></div><p className="mt-2 text-xs font-semibold text-[#8a938f]">{percent} do total</p></div>
}

function ReportBar({ label, value, percent, color }: { label: string; value: string; percent: string; color: string }) {
  return <div><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-[#435149]">{label}</span><span className="text-[#7c8881]">{value}</span></div><div className="h-3 overflow-hidden rounded-full bg-[#edf0ee]"><div className={`h-full rounded-full ${color}`} style={{ width: percent }} /></div></div>
}

function Goal({ label, value, total, progress, color }: { label: string; value: string; total: string; progress: string; color: string }) {
  return <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-[#435149]">{label}</p><span className="text-xs font-bold text-[#7c8981]">{progress}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className={`h-full rounded-full ${color}`} style={{ width: progress }} /></div><div className="mt-2 flex justify-between text-xs text-[#9aa29e]"><span>{value}</span><span>{total}</span></div></div>
}
