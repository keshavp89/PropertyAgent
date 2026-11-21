"use client";

export default function DeskError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-20">
      <h1 className="text-4xl">The desk could not load.</h1>
      <p className="mt-3 text-muted">Try again in a moment. If this keeps happening, the database may still be waking up.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-pine px-4 py-2 text-sm text-paper">
        Retry
      </button>
    </div>
  );
}
