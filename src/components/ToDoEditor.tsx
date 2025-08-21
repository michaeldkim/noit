// src/components/ToDoEditor.tsx
import React from 'react';
import type { ToDoValue } from '../types';

type Props = {
  value: ToDoValue;
  onChange: (next: ToDoValue) => void;
};

function PriButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md border px-2.5 py-1 text-xs ' +
        (active
          ? 'border-sky-500 bg-sky-800/40 text-sky-100'
          : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700')
      }
    >
      {label}
    </button>
  );
}

export default function ToDoEditor({ value, onChange }: Props) {
  const set = <K extends keyof ToDoValue>(k: K, v: ToDoValue[K]) =>
    onChange({ ...value, [k]: v });

  // default date to today if empty
  React.useEffect(() => {
    if (!value.due) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      set('due', `${yyyy}-${mm}-${dd}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4">
      {/* 1) title / task */}
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-300">title / task</div>
        <input
          type="text"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="what do you need to do?"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* 2) priority */}
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-300">priority</div>
        <div className="flex items-center gap-2">
          <PriButton
            label="high"
            active={value.priority === 'high'}
            onClick={() => set('priority', 'high')}
          />
          <PriButton
            label="normal"
            active={value.priority === 'normal'}
            onClick={() => set('priority', 'normal')}
          />
          <PriButton
            label="can wait"
            active={value.priority === 'can-wait'}
            onClick={() => set('priority', 'can-wait')}
          />
        </div>
      </div>

      {/* 3) due date */}
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-300">due date</div>
        <input
          type="date"
          value={value.due}
          onChange={(e) => set('due', e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* 4) additional information */}
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-300">additional information</div>
        <textarea
          rows={6}
          value={value.info}
          onChange={(e) => set('info', e.target.value)}
          placeholder="details, links, notes…"
          className="w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </div>
  );
}
