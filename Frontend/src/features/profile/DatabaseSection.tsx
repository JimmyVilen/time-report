import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { exportDatabase, importDatabase } from '../../api/backup'
import { getSetupStatus } from '../../api/auth'
import { Button } from '../../components/Button'

const CONFIRM_PHRASE = 'IMPORTERA'
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30000

export function DatabaseSection() {
  const [file, setFile] = useState<File | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [restarting, setRestarting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!restarting) return
    const start = Date.now()
    const interval = setInterval(() => {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        clearInterval(interval)
        return
      }
      getSetupStatus()
        .then(() => {
          clearInterval(interval)
          window.location.reload()
        })
        .catch(() => { /* still restarting */ })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [restarting])

  const mutation = useMutation({
    mutationFn: (f: File) => importDatabase(f),
    onSuccess: () => setRestarting(true),
    onError: (e: Error) => setError(e.message),
  })

  const handleImport = () => {
    if (!file) return
    setError('')
    if (!window.confirm('Detta ersätter HELA databasen för alla användare. Fortsätta?')) return
    mutation.mutate(file)
  }

  if (restarting) {
    return (
      <div className="py-8">
        <h2 className="mb-1 text-sm font-medium text-[var(--foreground)]">Databas</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Databasen importerades. Appen startar om — sidan laddas om automatiskt…
        </p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <h2 className="mb-1 text-sm font-medium text-[var(--foreground)]">Databas</h2>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        Exportera eller importera hela databasen (endast administratörer)
      </p>

      <div className="flex flex-col gap-4 max-w-sm">
        <Button type="button" variant="secondary" onClick={exportDatabase} className="self-start">
          Exportera databas
        </Button>

        <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--foreground-muted)]">
            Importera en .zip eller .db-fil. Detta ersätter HELA databasen för alla användare —
            en säkerhetskopia av nuvarande databas tas automatiskt innan bytet.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.db"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-[var(--foreground)]"
          />
          <div>
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">
              Skriv &quot;{CONFIRM_PHRASE}&quot; för att bekräfta
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <Button
            type="button"
            variant="danger"
            disabled={!file || confirmText !== CONFIRM_PHRASE}
            loading={mutation.isPending}
            onClick={handleImport}
            className="self-start"
          >
            Importera databas
          </Button>
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </div>
    </div>
  )
}
