import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-sp-bg">
      <Navbar />
      <main className="flex-1 pt-14">{children}</main>
    </div>
  );
}
