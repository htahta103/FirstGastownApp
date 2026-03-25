import { Link } from 'react-router-dom'

export function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-100">About</h1>
      <p className="mt-3 text-gray-400">
        React Router v6 route demo. API calls use{' '}
        <code className="rounded bg-gray-800 px-1 py-0.5 font-mono text-sm">
          /api
        </code>{' '}
        (see <code className="font-mono text-sm">vite.config.ts</code>).
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-violet-400 hover:text-violet-300"
      >
        ← Home
      </Link>
    </div>
  )
}
