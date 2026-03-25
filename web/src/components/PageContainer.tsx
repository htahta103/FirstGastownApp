import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
