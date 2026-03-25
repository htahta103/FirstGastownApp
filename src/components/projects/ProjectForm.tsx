import { useState, type FormEvent } from 'react'
import type { ProjectInput } from '../../types'
import { PRESET_PROJECT_COLORS, PRESET_PROJECT_ICONS } from '../../lib/projectUi'
import { Button, Input } from '../ui'

type DefaultValues = {
  name: string
  icon: string
  color: string
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = 'Save',
}: {
  defaultValues: DefaultValues
  onSubmit: (data: ProjectInput) => void
  onCancel?: () => void
  isPending: boolean
  submitLabel?: string
}) {
  const [name, setName] = useState(defaultValues.name)
  const [icon, setIcon] = useState(defaultValues.icon)
  const [color, setColor] = useState(defaultValues.color)
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) {
      setError('Name is required')
      return
    }
    setError('')
    onSubmit({ name: n, icon, color })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Work, Personal"
        error={error}
        autoFocus
      />

      <div className="space-y-2">
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
          Icon
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROJECT_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`flex size-10 items-center justify-center rounded-xl border text-lg transition-colors
                ${
                  icon === ic
                    ? 'border-violet-400/50 bg-violet-500/15 ring-1 ring-violet-400/30'
                    : 'border-slate-200/90 bg-white/80 hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.14]'
                }`}
              aria-label={`Select icon ${ic}`}
            >
              {ic}
            </button>
          ))}
        </div>
        <Input
          label="Custom icon"
          hint="Emoji or a short label (e.g. folder)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="📁"
        />
      </div>

      <div className="space-y-2">
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
          Color
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-9 rounded-full ring-2 ring-offset-2 ring-offset-slate-50 transition-shadow dark:ring-offset-gray-950 ${
                color === c ? 'ring-violet-400' : 'ring-transparent hover:ring-slate-300 dark:hover:ring-white/20'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <Input
          label="Hex"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#3B82F6"
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
