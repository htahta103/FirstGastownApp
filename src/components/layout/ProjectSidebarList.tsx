import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listProjects } from '../../api/client'
import { displayProjectIcon } from '../../lib/projectUi'
import { Skeleton } from '../ui'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-white/[0.08] text-violet-200'
      : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
  }`

export function ProjectSidebarList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })

  return (
    <div className="mt-6 border-t border-white/[0.06] pt-5">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
        Projects
      </p>
      <NavLink to="/projects" className={linkClass}>
        <span className="text-base opacity-80" aria-hidden>
          ⊞
        </span>
        <span className="truncate font-medium">All projects</span>
      </NavLink>
      <div className="mt-1 max-h-[40vh] space-y-0.5 overflow-y-auto pr-1">
        {isLoading && (
          <>
            <Skeleton className="mx-3 my-2 h-9 rounded-lg" />
            <Skeleton className="mx-3 my-2 h-9 rounded-lg" />
          </>
        )}
        {!isLoading &&
          (projects?.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-600">No projects yet</p>
          ) : (
            projects?.map((p) => (
              <NavLink
                key={p.id}
                to={`/project/${p.id}`}
                className={linkClass}
                title={p.name}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] text-sm"
                  style={{
                    backgroundColor: `${p.color}18`,
                    borderColor: `${p.color}40`,
                  }}
                >
                  {displayProjectIcon(p.icon)}
                </span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
              </NavLink>
            ))
          ))}
      </div>
    </div>
  )
}
