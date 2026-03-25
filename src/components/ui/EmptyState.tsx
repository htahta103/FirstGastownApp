interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, icon = '📋', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-md">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-blue-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
