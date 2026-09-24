'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHousehold, joinHousehold } from '@/app/actions/household'

type HouseholdType = 'single' | 'couple' | 'family'

export function HouseholdSetup({ name }: { name: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [householdType, setHouseholdType] = useState<HouseholdType | null>(null)
  const [groupName, setGroupName] = useState('')
  const [familyNames, setFamilyNames] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'create') {
        const label = householdType === 'family'
          ? `Família · ${familyNames.trim()}`
          : householdType === 'couple'
            ? `Casal · ${groupName.trim()}`
            : 'Individual'
        await createHousehold(label)
      } else await joinHousehold(inviteCode)
      router.refresh()
    } catch {
      setError(mode === 'join' ? 'Esse código não foi encontrado.' : 'Não foi possível criar a conta compartilhada.')
    } finally {
      setLoading(false)
    }
  }

  const createReady = householdType === 'single' || (householdType === 'couple' && groupName.trim().length > 1) || (householdType === 'family' && familyNames.trim().length > 2)

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f8fa] px-5 py-10 text-[#203f36]">
      <section className="w-full max-w-lg rounded-3xl border border-[#e5e9e7] bg-white p-8 shadow-[0_18px_50px_rgba(32,63,54,.08)] sm:p-10">
        <p className="text-sm font-semibold text-[#779a43]">Olá, {name.split(' ')[0]}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.04em]">Como você vai usar o casal.?</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#7c8881]">Conte quem vai compartilhar os gastos. Depois, você poderá enviar um código de convite.</p>
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#f2f5f1] p-1 text-sm font-semibold">
          <button type="button" onClick={() => setMode('create')} className={`rounded-lg py-2.5 ${mode === 'create' ? 'bg-white text-[#203f36] shadow-sm' : 'text-[#89918e]'}`}>Criar grupo</button>
          <button type="button" onClick={() => setMode('join')} className={`rounded-lg py-2.5 ${mode === 'join' ? 'bg-white text-[#203f36] shadow-sm' : 'text-[#89918e]'}`}>Usar convite</button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          {mode === 'create' ? <>
            <fieldset>
              <legend className="text-sm font-semibold text-[#435149]">Você é solteiro, casal ou família?</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([['single', 'Solteiro'], ['couple', 'Casal'], ['family', 'Família']] as const).map(([type, label]) => <button key={type} type="button" onClick={() => setHouseholdType(type)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${householdType === type ? 'border-[#8eaf55] bg-[#eef8df] text-[#46651f]' : 'border-[#dfe6e1] bg-[#fbfcfb] text-[#6f7b74]'}`}>{label}</button>)}
              </div>
            </fieldset>
            {householdType === 'couple' && <label className="block text-sm font-semibold text-[#435149]">Nome do casal<input value={groupName} onChange={(event) => setGroupName(event.target.value)} required placeholder="Ex.: Ana e João" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 outline-none focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" /></label>}
            {householdType === 'family' && <label className="block text-sm font-semibold text-[#435149]">Nomes das pessoas<input value={familyNames} onChange={(event) => setFamilyNames(event.target.value)} required placeholder="Ex.: Ana, João, Lucas e Bia" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 outline-none focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" /><span className="mt-1 block text-xs font-normal text-[#8a948e]">Separe os nomes por vírgulas.</span></label>}
          </> : <label className="block text-sm font-semibold text-[#435149]">Código do convite<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} required placeholder="Ex.: A1B2C3D4" className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 outline-none focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" /></label>}
          {error && <p className="text-sm text-[#a33c30]" role="alert">{error}</p>}
          <button disabled={loading || (mode === 'create' && !createReady)} className="h-12 w-full rounded-xl bg-[#203f36] text-sm font-bold text-white disabled:opacity-60">{loading ? 'Salvando...' : mode === 'create' ? 'Criar grupo compartilhado' : 'Entrar na casa'}</button>
        </form>
      </section>
    </main>
  )
}
