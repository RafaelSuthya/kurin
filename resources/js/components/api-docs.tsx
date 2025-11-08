import React from 'react';

const BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://127.0.0.1:8000/api';

export default function ApiDocs() {
  return (
    <div className="relative w-full">
      <div className="rounded-xl border border-sidebar-border/70 bg-white p-4 dark:border-sidebar-border dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold mb-2">API Documentation (Scribe)</h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-3">
          Dokumentasi lengkap hasil generate Scribe. Base URL:
          <code className="ml-2 inline-block rounded bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-800">{BASE_URL}</code>
        </p>
        {/* Embed halaman Scribe yang ada di public/docs */}
        <div className="relative overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
          <iframe
            src="/docs"
            title="API Docs"
            className="w-full h-[75vh]"
          />
        </div>
      </div>
    </div>
  );
}