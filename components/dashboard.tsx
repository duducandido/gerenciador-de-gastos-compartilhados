'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { updateHouseholdSettings, updateProfileAvatar } from '@/app/actions/household'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wallet,
  X,
} from 'lucide-react'

const expenses = [
  { title: 'Mercado do mês', category: 'Casa', date: 'Hoje, 10:42', amount: 284.9, icon: ShoppingBag, color: 'bg-amber-100 text-amber-700' },
  { title: 'Aluguel', category: 'Casa', date: '02 jun, 08:00', amount: 1850, icon: Home, color: 'bg-blue-100 text-blue-700' },
  { title: 'Jantar de sexta', category: 'Lazer', date: '01 jun, 21:18', amount: 126.4, icon: Utensils, color: 'bg-rose-100 text-rose-700' },
  { title: 'Uber', category: 'Transporte', date: '31 mai, 18:36', amount: 32.8, icon: ArrowUpRight, color: 'bg-violet-100 text-violet-700' },
]

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Page() {
  const [showInvite, setShowInvite] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Casa')
  const [profileName, setProfileName] = useState('Marina')
  const [accountType, setAccountType] = useState<'single' | 'couple' | 'family'>('couple')
  const [groupNames, setGroupNames] = useState('Marina & Rafael')
  const [monthlyLimit, setMonthlyLimit] = useState('3800')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [avatarImage, setAvatarImage] = useState<string | null>(null)
  const [expenseItems, setExpenseItems] = useState(expenses)
  const [expenseError, setExpenseError] = useState('')
  const [avatarColor, setAvatarColor] = useState('#f2c9a8')
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState(3)
  const [showGoal, setShowGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [expenseFilter, setExpenseFilter] = useState('Todas')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const avatarInitials = profileName.split(' ').filter(Boolean).slice(0, 2).map((name) => name[0]).join('').toUpperCase() || 'EU'

  function goToTab(tab: string, target?: string) {
    setActiveTab(tab)
    setMobileMenu(false)
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addExpense() {
    const amount = Number(expenseAmount.replace(',', '.'))
    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Informe uma descrição e um valor maior que zero.')
      return
    }
    setExpenseItems((current) => [{ title: expenseTitle.trim(), category: expenseCategory, date: 'Agora', amount, icon: Wallet, color: 'bg-emerald-100 text-emerald-700' }, ...current])
    setExpenseTitle('')
    setExpenseAmount('')
    setExpenseError('')
    setShowExpense(false)
  }
  const router = useRouter()
  const total = useMemo(() => expenseItems.reduce((sum, item) => sum + item.amount, 0), [expenseItems])
  const visibleExpenses = useMemo(() => expenseFilter === 'Todas' ? expenseItems : expenseItems.filter((item) => item.category === expenseFilter), [expenseFilter, expenseItems])

  function addGoal() {
    if (!goalTitle.trim()) return
    setCustomGoals((current) => [...current, goalTitle.trim()])
    setGoalTitle('')
    setShowGoal(false)
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

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#20252b]">
      <header className="sticky top-0 z-20 border-b border-[#e6e9ed] bg-[#f7f8fa]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#203f36] text-[#c8f169]"><Wallet size={20} strokeWidth={2.4} /></div>
            <div><p className="text-[17px] font-bold tracking-tight">casal.</p><p className="text-[10px] font-medium uppercase tracking-[0.19em] text-[#89918e]">finanças a dois</p></div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-full p-2.5 text-[#7d8582] transition hover:bg-white hover:text-[#203f36]" aria-label="Notificações"><Bell size={18} /></button>
            <div className="h-8 w-px bg-[#dfe3e1]" />
            <button onClick={() => setShowAvatarEditor(true)} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm" aria-label="Editar foto do perfil"><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-[#713d22]" style={{ backgroundColor: avatarColor }}>{avatarImage ? <img src={avatarImage} alt="Foto do perfil" className="h-full w-full object-cover" /> : avatarInitials}</span><span className="text-sm font-semibold">{groupNames}</span><ChevronDown size={15} className="text-[#99a09e]" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1320px]">
        <aside className={`${mobileMenu ? 'flex' : 'hidden'} fixed inset-0 z-10 w-72 flex-col border-r border-[#e6e9ed] bg-[#f7f8fa] p-5 pt-24 lg:static lg:flex lg:min-h-[calc(100vh-80px)] lg:w-60 lg:bg-transparent lg:p-8 lg:pt-10`}>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => goToTab('overview')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><LayoutDashboard size={18} /> Visão geral</button>
            <button onClick={() => goToTab('expenses', 'gastos')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'expenses' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><ArrowDownLeft size={18} /> Gastos</button>
            <button onClick={() => goToTab('goals', 'metas')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'goals' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><Sparkles size={18} /> Metas</button>
            <button onClick={() => goToTab('calendar')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'calendar' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><CalendarDays size={18} /> Calendário</button>
            <button onClick={() => goToTab('reports')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'reports' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><ArrowUpRight size={18} /> Relatórios</button>
          </nav>
          <div className="my-8 h-px bg-[#e4e8e6]" />
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1a9a5]">Sua conta</p>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => setShowInvite(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] hover:bg-white"><Share2 size={18} /> Compartilhar conta</button>
            <button onClick={() => goToTab('settings')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'settings' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><Settings size={18} /> Configurações</button>
            <button onClick={handleSignOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] transition hover:bg-[#fff1ef] hover:text-[#a33c30] disabled:cursor-wait disabled:opacity-60"><LogOut size={18} /> {signingOut ? 'Saindo...' : 'Sair da conta'}</button>
          </nav>
          <div className="mt-auto hidden rounded-2xl bg-[#e7f3d6] p-4 lg:block"><p className="mb-2 text-xs font-bold text-[#32513d]">Dica do mês</p><p className="text-xs leading-relaxed text-[#5d7561]">Vocês já economizaram 12% comparado ao mês passado.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#c8dfaf]"><div className="h-full w-[72%] rounded-full bg-[#94bd53]" /></div></div>
        </aside>

        {activeTab === 'overview' && <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Terça-feira, 03 de junho de 2025</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Bom dia, Marina.</h1></div><button onClick={() => setShowExpense(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#c8f169] px-4 py-3 text-sm font-bold text-[#203f36] shadow-[0_5px_15px_rgba(141,183,61,.18)] transition hover:-translate-y-0.5"><Plus size={17} /> Adicionar gasto</button></div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#203f36] p-6 text-white shadow-[0_12px_30px_rgba(32,63,54,.13)] md:col-span-2"><div className="flex items-start justify-between"><div><p className="text-sm text-[#a8c0b2]">Total gasto em junho</p><p className="mt-2 text-4xl font-bold tracking-[-0.05em]">{formatCurrency(total)}</p></div><div className="rounded-xl bg-white/10 p-3 text-[#c8f169]"><Wallet size={22} /></div></div><div className="mt-7 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs text-[#a8c0b2]"><span className="flex items-center gap-1 text-[#c8f169]"><ArrowDownLeft size={13} /> 8,4%</span> vs. mês passado</div><div className="h-2 w-48 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[61%] rounded-full bg-[#c8f169]" /></div></div><p className="text-right text-xs text-[#a8c0b2]">limite mensal<br /><strong className="text-sm text-white">R$ 3.800,00</strong></p></div></div>
            <div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-[#8a938f]">Saldo do mês</p><p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#203f36]">R$ 1.412,60</p></div><div className="rounded-xl bg-[#eaf5dd] p-3 text-[#719b37]"><ArrowDownLeft size={21} /></div></div><p className="mt-7 text-xs text-[#8a938f]">disponível para vocês</p><div className="mt-2 flex justify-between text-xs font-semibold text-[#4d6256]"><span>37% usado</span><span>R$ 3.800</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full w-[37%] rounded-full bg-[#9bc65b]" /></div></div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <section id="gastos" className="rounded-2xl border border-[#e5e9e7] bg-white p-5 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Últimos gastos</h2><p className="mt-1 text-xs text-[#8a938f]">Tudo o que foi registrado na conta</p></div><button onClick={() => goToTab('expenses')} className="text-xs font-bold text-[#789b40]">Ver todos</button></div><div className="space-y-2">{expenseItems.map((expense) => { const Icon = expense.icon; return <div key={expense.title} className="flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-[#f8faf7]"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${expense.color}`}><Icon size={18} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#35433d]">{expense.title}</p><p className="mt-0.5 text-xs text-[#9aa29e]">{expense.category} · {expense.date}</p></div></div><p className="shrink-0 text-sm font-bold text-[#35433d]">{formatCurrency(expense.amount)}</p></div> })}</div></section>
            <section id="metas" className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Metas do casal</h2><p className="mt-1 text-xs text-[#8a938f]">Construindo juntos</p></div><button className="rounded-lg p-2 text-[#8a938f] hover:bg-[#f4f7f2]" aria-label="Adicionar meta"><Plus size={17} /></button></div><div className="space-y-5"><Goal label="Viagem para Gramado" value="R$ 2.450" total="R$ 5.000" progress="49%" color="bg-[#e7a65b]"/><Goal label="Reserva de emergência" value="R$ 7.200" total="R$ 12.000" progress="60%" color="bg-[#7ea8a0]"/><Goal label="Noite sem gastar" value="3 dias" total="5 dias" progress="60%" color="bg-[#b68ac5]"/></div></section>
          </div>
        </section>}

        {activeTab === 'expenses' && <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12">
          <div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Movimentações da conta</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Gastos</h1><p className="mt-2 text-sm text-[#7c8881]">Acompanhe e organize todas as despesas do mês.</p></div><button onClick={() => setShowExpense(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#c8f169] px-4 py-3 text-sm font-bold text-[#203f36]"><Plus size={17} /> Adicionar gasto</button></div>
          <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-[#203f36] p-6 text-white"><p className="text-sm text-[#a8c0b2]">Total em junho</p><p className="mt-2 text-3xl font-bold">{formatCurrency(total)}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><p className="text-sm text-[#8a938f]">Quantidade</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{expenseItems.length}</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><p className="text-sm text-[#8a938f]">Média por gasto</p><p className="mt-2 text-3xl font-bold text-[#203f36]">{formatCurrency(total / expenseItems.length)}</p></div></div>
          <div className="mt-8 rounded-2xl border border-[#e5e9e7] bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-lg font-bold text-[#203f36]">Todos os gastos</h2><label className="flex items-center gap-2 text-xs font-semibold text-[#7c8881]">Filtrar por<select value={expenseFilter} onChange={(event) => setExpenseFilter(event.target.value)} className="rounded-lg border border-[#dce4df] bg-white px-2 py-1.5 text-xs text-[#35433d]"><option>Todas</option><option>Casa</option><option>Alimentação</option><option>Transporte</option><option>Lazer</option></select></label></div><div className="mt-5 space-y-2">{visibleExpenses.map((expense) => { const Icon = expense.icon; return <div key={expense.title} className="flex items-center justify-between rounded-xl px-2 py-3 hover:bg-[#f8faf7]"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${expense.color}`}><Icon size={18} /></div><div><p className="text-sm font-semibold text-[#35433d]">{expense.title}</p><p className="text-xs text-[#9aa29e]">{expense.category} · {expense.date}</p></div></div><p className="text-sm font-bold text-[#35433d]">{formatCurrency(expense.amount)}</p></div> })}</div></div>
        </section>}

        {activeTab === 'calendar' && <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12"><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Planejamento mensal</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Calendário</h1><p className="mt-2 text-sm text-[#7c8881]">Visualize vencimentos, contas recorrentes e lembretes.</p></div><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#203f36]">Junho 2025</p><p className="mt-1 text-xs text-[#8a938f]">Contas planejadas</p></div><button onClick={() => setShowExpense(true)} className="flex items-center gap-2 rounded-xl bg-[#c8f169] px-3 py-2 text-xs font-bold text-[#203f36]"><Plus size={15} /> Lançar conta</button></div><div className="grid grid-cols-7 gap-2 text-center text-xs"><div className="col-span-7 grid grid-cols-7 pb-2 font-bold text-[#9aa29e]">{['D','S','T','Q','Q','S','S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>{Array.from({ length: 30 }, (_, index) => { const day = index + 1; const highlighted = [2, 5, 10, 15, 20, 25].includes(day); return <button key={day} type="button" onClick={() => setSelectedDay(day)} aria-label={`Selecionar dia ${day}`} className={`relative rounded-xl p-3 font-semibold transition hover:bg-[#f1f8e6] ${day === selectedDay ? 'bg-[#203f36] text-white' : 'text-[#53635a]'}`}>{day}{highlighted && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${day === selectedDay ? 'bg-[#c8f169]' : 'bg-[#9bc65b]'}`} />}</button> })}</div></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><h2 className="text-lg font-bold text-[#203f36]">Próximos lembretes</h2><p className="mt-1 text-xs text-[#8a938f]">Dia selecionado: {selectedDay} de junho</p><div className="mt-5 space-y-3"><Reminder title="Aluguel" date="Dia 05" amount="R$ 1.850,00"/><Reminder title="Internet" date="Dia 10" amount="R$ 119,90"/><Reminder title="Cartão de crédito" date="Dia 15" amount="R$ 640,00"/></div><button className="mt-5 w-full rounded-xl border border-[#dce4df] py-3 text-sm font-bold text-[#52645a] hover:bg-[#f8faf7]">Gerenciar lembretes</button></div></div></section>}

        {activeTab === 'reports' && <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Análise da conta</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Relatórios</h1><p className="mt-2 text-sm text-[#7c8881]">Entendam para onde o dinheiro está indo.</p></div><button onClick={() => window.print()} className="rounded-xl border border-[#dce4df] bg-white px-4 py-3 text-sm font-bold text-[#52645a]">Exportar relatório</button></div><div className="grid gap-4 md:grid-cols-3"><Stat label="Casa" value="R$ 2.134,90" percent="56%" color="bg-[#7ea8a0]"/><Stat label="Alimentação" value="R$ 642,30" percent="17%" color="bg-[#e7a65b]"/><Stat label="Lazer" value="R$ 386,40" percent="10%" color="bg-[#b68ac5]"/></div><div className="mt-6 rounded-2xl border border-[#e5e9e7] bg-white p-6"><h2 className="text-lg font-bold text-[#203f36]">Divisão por categoria</h2><div className="mt-6 space-y-5"><ReportBar label="Casa" value="R$ 2.134,90" percent="56%" color="bg-[#7ea8a0]"/><ReportBar label="Alimentação" value="R$ 642,30" percent="17%" color="bg-[#e7a65b]"/><ReportBar label="Transporte" value="R$ 418,00" percent="11%" color="bg-[#9bc65b]"/><ReportBar label="Lazer" value="R$ 386,40" percent="10%" color="bg-[#b68ac5]"/></div></div></section>}

        {activeTab === 'goals' && <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12"><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Planos para o futuro</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Metas</h1><p className="mt-2 text-sm text-[#7c8881]">Acompanhem cada conquista juntos.</p></div><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Metas do casal</h2><p className="mt-1 text-xs text-[#8a938f]">Construindo juntos</p></div><button className="flex items-center gap-2 rounded-xl bg-[#c8f169] px-4 py-3 text-sm font-bold text-[#203f36]" onClick={() => setShowGoal(true)}><Plus size={17} /> Nova meta</button></div><div className="grid gap-8 md:grid-cols-2"><Goal label="Viagem para Gramado" value="R$ 2.450" total="R$ 5.000" progress="49%" color="bg-[#e7a65b]"/><Goal label="Reserva de emergência" value="R$ 7.200" total="R$ 12.000" progress="60%" color="bg-[#7ea8a0]"/><Goal label="Noite sem gastar" value="3 dias" total="5 dias" progress="60%" color="bg-[#b68ac5]"/>{customGoals.map((label) => <Goal key={label} label={label} value="R$ 0" total="Defina um alvo" progress="0%" color="bg-[#9bc65b]"/>)}</div></div></section>}

        {activeTab === 'settings' && <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12"><div className="mb-9"><p className="mb-2 text-sm font-medium text-[#8a938f]">Preferências da sua conta</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Configurações</h1><p className="mt-2 text-sm text-[#7c8881]">Atualize seus dados e a forma como vocês organizam as finanças.</p></div><div className="grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><h2 className="text-lg font-bold text-[#203f36]">Perfil</h2><p className="mt-1 text-sm text-[#8a938f]">Essas informações aparecem para quem compartilha a conta.</p><div className="mt-6 space-y-5"><label className="block text-sm font-semibold text-[#35433d]">Seu nome<input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" /></label><fieldset><legend className="text-sm font-semibold text-[#35433d]">Como vocês organizam a conta?</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{([{ value: 'single', label: 'Solteiro', description: 'Só eu' }, { value: 'couple', label: 'Casal', description: 'Duas pessoas' }, { value: 'family', label: 'Família', description: 'Várias pessoas' }] as const).map((option) => <button key={option.value} type="button" onClick={() => setAccountType(option.value)} className={`rounded-xl border px-3 py-3 text-left transition ${accountType === option.value ? 'border-[#8fb64f] bg-[#f1f8e6] text-[#315238]' : 'border-[#dce4df] text-[#6f7d74] hover:bg-[#f8faf7]'}`}><span className="block text-sm font-bold">{option.label}</span><span className="mt-1 block text-xs">{option.description}</span></button>)}</div></fieldset><label className="block text-sm font-semibold text-[#35433d]">{accountType === 'single' ? 'Seu nome completo' : accountType === 'couple' ? 'Nome do casal' : 'Nomes das pessoas da família'}<input value={groupNames} onChange={(event) => setGroupNames(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder={accountType === 'family' ? 'Ex.: Marina, Rafael e Sofia' : accountType === 'couple' ? 'Ex.: Marina & Rafael' : 'Ex.: Marina'} /></label><label className="block text-sm font-semibold text-[#35433d]">Limite mensal<input value={monthlyLimit} onChange={(event) => setMonthlyLimit(event.target.value)} type="number" min="0" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" /></label><button onClick={saveSettings} className="rounded-xl bg-[#203f36] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2d5549]">{settingsSaved ? 'Alterações salvas' : 'Salvar alterações'}</button></div></div><div className="space-y-6"><div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><h2 className="text-lg font-bold text-[#203f36]">Conta compartilhada</h2><p className="mt-1 text-sm text-[#8a938f]">Marina & Rafael</p><button onClick={() => setShowInvite(true)} className="mt-5 flex items-center gap-2 rounded-xl border border-[#cbdac4] px-4 py-3 text-sm font-bold text-[#496344] hover:bg-[#f5faed]"><Share2 size={16} /> Gerenciar convite</button></div><div className="rounded-2xl border border-[#f0d6d1] bg-[#fff8f6] p-6"><h2 className="text-lg font-bold text-[#8f3f35]">Zona de segurança</h2><p className="mt-1 text-sm leading-relaxed text-[#a56d65]">Para encerrar a sessão atual, use o botão abaixo.</p><button onClick={handleSignOut} className="mt-5 flex items-center gap-2 rounded-xl border border-[#e7b7b0] px-4 py-3 text-sm font-bold text-[#a33c30] hover:bg-white"><LogOut size={16} /> Sair da conta</button></div></div></div></section>}
      </div>

      {showAvatarEditor && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowAvatarEditor(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="flex flex-col items-center text-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-[#713d22]" style={{ backgroundColor: avatarColor }}>{avatarImage ? <img src={avatarImage} alt="Prévia da foto do perfil" className="h-full w-full object-cover" /> : avatarInitials}</div><h2 className="mt-5 text-xl font-bold text-[#203f36]">Personalizar perfil</h2><p className="mt-2 text-sm text-[#7c8881]">Escolha uma foto ou uma cor para o seu avatar.</p><label className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-[#203f36] px-4 py-3 text-sm font-bold text-white hover:bg-[#2d5549]"><Camera size={17} /> Escolher foto<input type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" /></label><div className="mt-5 flex gap-3" aria-label="Cores do avatar">{['#f2c9a8', '#c8f169', '#b9d9d0', '#d8b4e2', '#f5c2c7'].map((color) => <button key={color} type="button" onClick={() => { setAvatarColor(color); setAvatarImage(null) }} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-[#dce4df]" style={{ backgroundColor: color }} aria-label={`Usar cor ${color}`}>{avatarColor === color && !avatarImage && <Check size={16} className="text-[#203f36]" />}</button>)}</div><button onClick={saveAvatar} disabled={avatarSaving} className="mt-6 w-full rounded-xl border border-[#dce4df] py-3 text-sm font-bold text-[#203f36] hover:bg-[#f8faf7] disabled:opacity-60">{avatarSaving ? 'Salvando...' : 'Salvar avatar'}</button></div></div></div>}

      {showGoal && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowGoal(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Sparkles size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Criar meta</h2><p className="mt-2 text-sm text-[#7c8881]">Escolham algo para conquistar juntos.</p><label className="mt-6 block text-sm font-semibold text-[#35433d]">Nome da meta<input autoFocus value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) addGoal() }} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="Ex.: Viagem de férias" /></label><button onClick={addGoal} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white hover:bg-[#2d5549]">Salvar meta</button></div></div>}

      {showExpense && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowExpense(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Plus size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Adicionar gasto</h2><p className="mt-2 text-sm text-[#7c8881]">Registre uma despesa para a conta compartilhada.</p><div className="mt-6 space-y-4"><label className="block text-sm font-semibold text-[#35433d]">Descrição<input value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="Ex.: Mercado do mês" /></label><label className="block text-sm font-semibold text-[#35433d]">Valor<input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="0,00" /></label><label className="block text-sm font-semibold text-[#35433d]">Categoria<select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] bg-white px-4 py-3 outline-none focus:border-[#9bc65b]"><option>Casa</option><option>Alimentação</option><option>Transporte</option><option>Lazer</option></select></label></div><button onClick={addExpense} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white transition hover:bg-[#2d5549]">Salvar gasto</button></div></div>}

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
