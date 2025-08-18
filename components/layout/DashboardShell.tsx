'use client';

import { ReactNode } from 'react';

export default function DashboardShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0A1F44' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          {description ? <p className="text-gray-300">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}



