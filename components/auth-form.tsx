'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, WalletCards } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const isSignUp = mode === 'sign-up'

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: name.trim() })
      : await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError('Não foi possível concluir. Confira seus dados e tente novamente.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#07110d] px-5 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#c8f169]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#79a6ff]/10 blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#101b16]/90 shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-[#c8f169] p-10 text-[#15251d] lg:flex">
          <div><div className="mb-16 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#203f36] text-[#c8f169] shadow-lg">₿</div><div><p className="text-xl font-bold tracking-tight">casal.</p><p className="text-[10px] font-bold uppercase tracking-[.2em] opacity-65">finanças a dois</p></div></div><p className="max-w-sm text-sm font-semibold uppercase tracking-[.16em] opacity-60">Planejem melhor. Vivam mais leves.</p><h2 className="mt-5 max-w-sm text-5xl font-bold leading-[.95] tracking-[-.06em]">O dinheiro de vocês, no mesmo ritmo.</h2></div>
          <div className="space-y-3"><div className="flex items-center gap-3 rounded-2xl bg-[#203f36]/10 p-4"><WalletCards size={20} /><span className="text-sm font-semibold">Gastos organizados em um só lugar</span></div><div className="flex items-center gap-3 rounded-2xl bg-[#203f36]/10 p-4"><ShieldCheck size={20} /><span className="text-sm font-semibold">Privacidade e segurança sempre</span></div></div>
        </div>
        <div className="p-7 sm:p-12"><div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8f169] text-[#203f36]">₿</div><div><p className="text-lg font-bold">casal.</p><p className="text-[10px] uppercase tracking-[.19em] text-white/45">finanças a dois</p></div></div><div className="mb-8 flex items-center gap-2 text-[#c8f169]"><Sparkles size={17} /><span className="text-xs font-bold uppercase tracking-[.16em]">Seu espaço financeiro</span></div>
          <h1 className="text-4xl font-bold tracking-[-.06em] sm:text-5xl">{isSignUp ? 'Comecem juntos.' : 'Bom ter vocês de volta.'}</h1><p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">{isSignUp ? 'Criem uma conta e transformem planos em hábitos.' : 'Entre para continuar cuidando dos planos de vocês.'}</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">{isSignUp && <label className="block text-sm font-semibold text-white/75">Seu nome<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder="Como podemos chamar você?" className="mt-2 h-13 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#c8f169] focus:bg-white/[.07] focus:ring-4 focus:ring-[#c8f169]/10" /></label>}<label className="block text-sm font-semibold text-white/75">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="voce@email.com" className="mt-2 h-13 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#c8f169] focus:bg-white/[.07] focus:ring-4 focus:ring-[#c8f169]/10" /></label><label className="block text-sm font-semibold text-white/75">Senha<span className="relative mt-2 block"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Mínimo de 8 caracteres" className="h-13 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 pr-12 text-white outline-none transition placeholder:text-white/25 focus:border-[#c8f169] focus:bg-white/[.07] focus:ring-4 focus:ring-[#c8f169]/10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/40 transition hover:text-[#c8f169]">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>{error && <p ref={errorRef} tabIndex={-1} className="auth-error rounded-2xl border px-4 py-3 text-sm font-semibold outline-none" role="alert" aria-live="assertive">{error}</p>}<button type="submit" disabled={loading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#c8f169] text-sm font-bold text-[#17251d] transition hover:bg-[#d8f58e] hover:shadow-[0_0_30px_rgba(200,241,105,.2)] disabled:opacity-60">{loading ? 'Aguarde...' : isSignUp ? 'Criar minha conta' : 'Entrar'}<ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></button></form><p className="mt-7 text-center text-sm text-white/45">{isSignUp ? 'Já têm uma conta? ' : 'Ainda não têm uma conta? '}<Link href={isSignUp ? '/sign-in' : '/sign-up'} className="font-bold text-[#c8f169] hover:underline">{isSignUp ? 'Entrar' : 'Criar conta'}</Link></p>
        </div>
      </section>
    </main>
  )
}
