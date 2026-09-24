'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
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

  function goToTab(tab: string, target?: string) {
    setActiveTab(tab)
    setMobileMenu(false)
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addExpense() {
    if (!expenseTitle.trim() || !expenseAmount || Number(expenseAmount) <= 0) return
    setExpenseTitle('')
    setExpenseAmount('')
    setShowExpense(false)
  }
  const router = useRouter()
  const total = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [])

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
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
            <button className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2c9a8] text-xs font-bold text-[#713d22]">MR</span><span className="text-sm font-semibold">Marina & Rafael</span><ChevronDown size={15} className="text-[#99a09e]" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1320px]">
        <aside className={`${mobileMenu ? 'flex' : 'hidden'} fixed inset-0 z-10 w-72 flex-col border-r border-[#e6e9ed] bg-[#f7f8fa] p-5 pt-24 lg:static lg:flex lg:min-h-[calc(100vh-80px)] lg:w-60 lg:bg-transparent lg:p-8 lg:pt-10`}>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => goToTab('overview')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><LayoutDashboard size={18} /> Visão geral</button>
            <button onClick={() => goToTab('expenses', 'gastos')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'expenses' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><ArrowDownLeft size={18} /> Gastos</button>
            <button onClick={() => goToTab('goals', 'metas')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeTab === 'goals' ? 'bg-[#203f36] text-white shadow-sm' : 'text-[#727b77] hover:bg-white'}`}><Sparkles size={18} /> Metas</button>
          </nav>
          <div className="my-8 h-px bg-[#e4e8e6]" />
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1a9a5]">Sua conta</p>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => setShowInvite(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] hover:bg-white"><Share2 size={18} /> Compartilhar conta</button>
            <button onClick={() => window.alert('As configurações da conta estarão disponíveis em breve.')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] hover:bg-white"><Settings size={18} /> Configurações</button>
            <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[#727b77] transition hover:bg-[#fff1ef] hover:text-[#a33c30]"><LogOut size={18} /> Sair da conta</button>
          </nav>
          <div className="mt-auto hidden rounded-2xl bg-[#e7f3d6] p-4 lg:block"><p className="mb-2 text-xs font-bold text-[#32513d]">Dica do mês</p><p className="text-xs leading-relaxed text-[#5d7561]">Vocês já economizaram 12% comparado ao mês passado.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#c8dfaf]"><div className="h-full w-[72%] rounded-full bg-[#94bd53]" /></div></div>
        </aside>

        <section className="min-w-0 flex-1 px-5 pb-12 pt-8 lg:px-10 lg:pt-12">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-[#8a938f]">Terça-feira, 03 de junho de 2025</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#203f36] sm:text-[38px]">Bom dia, Marina.</h1></div><button onClick={() => setShowExpense(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#c8f169] px-4 py-3 text-sm font-bold text-[#203f36] shadow-[0_5px_15px_rgba(141,183,61,.18)] transition hover:-translate-y-0.5"><Plus size={17} /> Adicionar gasto</button></div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#203f36] p-6 text-white shadow-[0_12px_30px_rgba(32,63,54,.13)] md:col-span-2"><div className="flex items-start justify-between"><div><p className="text-sm text-[#a8c0b2]">Total gasto em junho</p><p className="mt-2 text-4xl font-bold tracking-[-0.05em]">{formatCurrency(total)}</p></div><div className="rounded-xl bg-white/10 p-3 text-[#c8f169]"><Wallet size={22} /></div></div><div className="mt-7 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs text-[#a8c0b2]"><span className="flex items-center gap-1 text-[#c8f169]"><ArrowDownLeft size={13} /> 8,4%</span> vs. mês passado</div><div className="h-2 w-48 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[61%] rounded-full bg-[#c8f169]" /></div></div><p className="text-right text-xs text-[#a8c0b2]">limite mensal<br /><strong className="text-sm text-white">R$ 3.800,00</strong></p></div></div>
            <div className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-[#8a938f]">Saldo do mês</p><p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#203f36]">R$ 1.412,60</p></div><div className="rounded-xl bg-[#eaf5dd] p-3 text-[#719b37]"><ArrowDownLeft size={21} /></div></div><p className="mt-7 text-xs text-[#8a938f]">disponível para vocês</p><div className="mt-2 flex justify-between text-xs font-semibold text-[#4d6256]"><span>37% usado</span><span>R$ 3.800</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full w-[37%] rounded-full bg-[#9bc65b]" /></div></div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <section id="gastos" className="rounded-2xl border border-[#e5e9e7] bg-white p-5 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Últimos gastos</h2><p className="mt-1 text-xs text-[#8a938f]">Tudo o que foi registrado na conta</p></div><button className="text-xs font-bold text-[#789b40]">Ver todos</button></div><div className="space-y-2">{expenses.map((expense) => { const Icon = expense.icon; return <div key={expense.title} className="flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-[#f8faf7]"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${expense.color}`}><Icon size={18} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#35433d]">{expense.title}</p><p className="mt-0.5 text-xs text-[#9aa29e]">{expense.category} · {expense.date}</p></div></div><p className="shrink-0 text-sm font-bold text-[#35433d]">{formatCurrency(expense.amount)}</p></div> })}</div></section>
            <section id="metas" className="rounded-2xl border border-[#e5e9e7] bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#203f36]">Metas do casal</h2><p className="mt-1 text-xs text-[#8a938f]">Construindo juntos</p></div><button className="rounded-lg p-2 text-[#8a938f] hover:bg-[#f4f7f2]" aria-label="Adicionar meta"><Plus size={17} /></button></div><div className="space-y-5"><Goal label="Viagem para Gramado" value="R$ 2.450" total="R$ 5.000" progress="49%" color="bg-[#e7a65b]"/><Goal label="Reserva de emergência" value="R$ 7.200" total="R$ 12.000" progress="60%" color="bg-[#7ea8a0]"/><Goal label="Noite sem gastar" value="3 dias" total="5 dias" progress="60%" color="bg-[#b68ac5]"/></div></section>
          </div>
        </section>
      </div>

      {showExpense && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowExpense(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Plus size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Adicionar gasto</h2><p className="mt-2 text-sm text-[#7c8881]">Registre uma despesa para a conta compartilhada.</p><div className="mt-6 space-y-4"><label className="block text-sm font-semibold text-[#35433d]">Descrição<input value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="Ex.: Mercado do mês" /></label><label className="block text-sm font-semibold text-[#35433d]">Valor<input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-2 w-full rounded-xl border border-[#dce4df] px-4 py-3 outline-none focus:border-[#9bc65b]" placeholder="0,00" /></label><label className="block text-sm font-semibold text-[#35433d]">Categoria<select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce4df] bg-white px-4 py-3 outline-none focus:border-[#9bc65b]"><option>Casa</option><option>Alimentação</option><option>Transporte</option><option>Lazer</option></select></label></div><button onClick={addExpense} className="mt-6 w-full rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white transition hover:bg-[#2d5549]">Salvar gasto</button></div></div>}

      {showInvite && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#17241f]/35 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><button onClick={() => setShowInvite(false)} className="absolute right-5 top-5 rounded-lg p-2 text-[#8a938f] hover:bg-[#f2f5f2]" aria-label="Fechar"><X size={18} /></button><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3d6] text-[#668c35]"><Share2 size={22} /></div><h2 className="text-2xl font-bold tracking-tight text-[#203f36]">Convide alguém para a conta</h2><p className="mt-2 text-sm leading-relaxed text-[#7c8881]">Compartilhe este link com sua namorada ou com quem participa dos gastos. Só entra quem tiver o convite.</p><div className="mt-6 rounded-2xl border border-dashed border-[#bdd397] bg-[#f5faed] p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#789b40]">Link de convite</p><p className="break-all text-sm font-bold text-[#375033]">https://{inviteLink}</p></div><button onClick={copyInvite} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#203f36] py-3.5 text-sm font-bold text-white transition hover:bg-[#2d5549]"><Copy size={16} /> {copied ? 'Link copiado' : 'Copiar link'}</button><p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#98a19c]"><CircleHelp size={13} /> O convite expira em 7 dias</p></div></div>}
    </main>
  )
}

function Goal({ label, value, total, progress, color }: { label: string; value: string; total: string; progress: string; color: string }) {
  return <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-[#435149]">{label}</p><span className="text-xs font-bold text-[#7c8981]">{progress}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className={`h-full rounded-full ${color}`} style={{ width: progress }} /></div><div className="mt-2 flex justify-between text-xs text-[#9aa29e]"><span>{value}</span><span>{total}</span></div></div>
}
