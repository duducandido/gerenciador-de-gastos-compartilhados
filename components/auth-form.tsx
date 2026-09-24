'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { joinHousehold } from '@/app/actions/household'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [profileType, setProfileType] = useState<'solteiro' | 'casal' | 'familia'>('casal')
  const [partnerName, setPartnerName] = useState('')
  const [familyNames, setFamilyNames] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const accountName = profileType === 'solteiro'
      ? name.trim()
      : profileType === 'casal'
        ? `${name.trim()} e ${partnerName.trim()}`
        : `${name.trim()}, ${familyNames.split(',').map((person) => person.trim()).filter(Boolean).join(', ')}`
    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: accountName })
      : await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError('Não foi possível concluir. Confira seus dados e tente novamente.')
      return
    }
    if (isSignUp && inviteCode.trim()) {
      try {
        await joinHousehold(inviteCode)
      } catch {
        setLoading(false)
        setError('Conta criada, mas o código de convite é inválido. Entre novamente e use um código válido.')
        return
      }
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f8fa] px-5 py-10 text-[#20252b]">
      <section className="w-full max-w-md rounded-3xl border border-[#e5e9e7] bg-white p-7 shadow-[0_18px_50px_rgba(32,63,54,.08)] sm:p-9">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#203f36] text-[#c8f169]">₿</div><div><p className="text-lg font-bold tracking-tight">casal.</p><p className="text-[10px] font-medium uppercase tracking-[.19em] text-[#89918e]">finanças a dois</p></div></div>
        <h1 className="text-3xl font-bold tracking-[-.04em] text-[#203f36]">{isSignUp ? 'Criem sua conta' : 'Bem-vindos de volta'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#7c8881]">{isSignUp ? 'Comecem a organizar a vida financeira juntos.' : 'Entre para continuar cuidando dos planos de vocês.'}</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {isSignUp && <div className="space-y-4">
            <fieldset>
              <legend className="text-sm font-semibold text-[#435149]">Como vocês vão organizar a conta?</legend>
              <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de conta">
                {([
                  ['solteiro', 'Solteiro'],
                  ['casal', 'Casal'],
                  ['familia', 'Família'],
                ] as const).map(([value, label]) => (
                  <label key={value} className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${profileType === value ? 'border-[#203f36] bg-[#e7f3d6] text-[#203f36]' : 'border-[#dfe6e1] text-[#7c8881] hover:border-[#8eaf55]'}`}>
                    <input type="radio" name="profileType" value={value} checked={profileType === value} onChange={() => setProfileType(value)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-semibold text-[#435149]">{profileType === 'solteiro' ? 'Seu nome' : profileType === 'casal' ? 'Seu nome' : 'Nome do responsável'}
              <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 font-normal outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" />
            </label>
            {profileType === 'casal' && <label className="block text-sm font-semibold text-[#435149]">Nome da outra pessoa
              <input value={partnerName} onChange={(event) => setPartnerName(event.target.value)} required autoComplete="off" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 font-normal outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" />
            </label>}
            {profileType === 'familia' && <label className="block text-sm font-semibold text-[#435149]">Nomes das pessoas da família
              <textarea value={familyNames} onChange={(event) => setFamilyNames(event.target.value)} required placeholder="Ex.: Ana, Pedro, Luiza" rows={2} className="mt-2 w-full resize-none rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 py-3 font-normal outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" />
              <span className="mt-1 block text-xs font-normal text-[#89918e]">Separe os nomes por vírgulas.</span>
            </label>}
            <label className="block text-sm font-semibold text-[#435149]">Código de convite <span className="font-normal text-[#89918e]">(opcional)</span>
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="Ex.: A1B2C3D4" autoComplete="off" maxLength={8} className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 font-normal uppercase tracking-[.18em] outline-none transition focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" />
              <span className="mt-1 block text-xs font-normal text-[#89918e]">Já faz parte de uma conta? Cole aqui o código recebido pelo responsável.</span>
            </label>
          </div>}
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
