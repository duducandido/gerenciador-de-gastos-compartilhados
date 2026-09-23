'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHousehold, joinHousehold } from '@/app/actions/household'

export function HouseholdSetup({ name }: { name: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'create') await createHousehold(value)
      else await joinHousehold(value)
      router.refresh()
    } catch {
      setError(mode === 'join' ? 'Esse código não foi encontrado.' : 'Não foi possível criar a conta compartilhada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f8fa] px-5 text-[#203f36]">
      <section className="w-full max-w-lg rounded-3xl border border-[#e5e9e7] bg-white p-8 shadow-[0_18px_50px_rgba(32,63,54,.08)] sm:p-10">
        <p className="text-sm font-semibold text-[#779a43]">Olá, {name.split(' ')[0]}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.04em]">Vamos criar a casa de vocês?</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#7c8881]">Crie uma conta compartilhada e envie o código para sua namorada, ou entre em uma casa que já existe.</p>
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#f2f5f1] p-1 text-sm font-semibold"><button type="button" onClick={() => setMode('create')} className={`rounded-lg py-2.5 ${mode === 'create' ? 'bg-white text-[#203f36] shadow-sm' : 'text-[#89918e]'}`}>Criar casa</button><button type="button" onClick={() => setMode('join')} className={`rounded-lg py-2.5 ${mode === 'join' ? 'bg-white text-[#203f36] shadow-sm' : 'text-[#89918e]'}`}>Usar convite</button></div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-[#435149]">{mode === 'create' ? 'Nome da casa' : 'Código do convite'}<input value={value} onChange={(event) => setValue(event.target.value)} required placeholder={mode === 'create' ? 'Ex.: Nossa casa' : 'Ex.: A1B2C3D4'} className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 outline-none focus:border-[#8eaf55] focus:ring-4 focus:ring-[#e7f3d6]" /></label>
          {error && <p className="text-sm text-[#a33c30]" role="alert">{error}</p>}
          <button disabled={loading} className="h-12 w-full rounded-xl bg-[#203f36] text-sm font-bold text-white disabled:opacity-60">{loading ? 'Salvando...' : mode === 'create' ? 'Criar conta compartilhada' : 'Entrar na casa'}</button>
        </form>
      </section>
    </main>
  )
}
