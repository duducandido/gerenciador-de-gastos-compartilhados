'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isSignUp = mode === 'sign-up'

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
    <main className="auth-screen flex min-h-svh items-center justify-center bg-[#f7f8fa] px-5 py-10 text-[#20252b]">
      <section className="auth-card w-full max-w-md rounded-3xl border border-[#e5e9e7] bg-white p-7 shadow-[0_18px_50px_rgba(32,63,54,.08)] sm:p-9">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#203f36] text-[#c8f169]">₿</div><div><p className="text-lg font-bold tracking-tight">casal.</p><p className="text-[10px] font-medium uppercase tracking-[.19em] text-[#89918e]">finanças a dois</p></div></div>
        <h1 className="text-3xl font-bold tracking-[-.04em] text-[#203f36]">{isSignUp ? 'Criem sua conta' : 'Bem-vindos de volta'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#7c8881]">{isSignUp ? 'Comecem a organizar a vida financeira juntos.' : 'Entre para continuar cuidando dos planos de vocês.'}</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {isSignUp && <label className="block text-sm font-semibold text-[#435149]">Seu nome
            <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 font-normal outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" />
          </label>}
          <label className="block text-sm font-semibold text-[#435149]">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 font-normal outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" /></label>
          <label className="block text-sm font-semibold text-[#435149]">Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 font-normal outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" /></label>
          {error && <p className="rounded-xl bg-[#fff1ef] px-3 py-2 text-sm text-[#a33c30]" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#203f36] text-sm font-bold text-white transition hover:bg-[#2d5549] disabled:opacity-60">{loading ? 'Aguarde...' : isSignUp ? 'Criar minha conta' : 'Entrar'}</button>
        </form>
        <p className="mt-7 text-center text-sm text-[#7c8881]">{isSignUp ? 'Já têm uma conta? ' : 'Ainda não têm uma conta? '}<Link href={isSignUp ? '/sign-in' : '/sign-up'} className="font-bold text-[#668c35] hover:underline">{isSignUp ? 'Entrar' : 'Criar conta'}</Link></p>
      </section>
    </main>
  )
}
