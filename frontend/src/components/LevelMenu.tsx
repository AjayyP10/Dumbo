import { useState } from 'react';

const levels = ['A1', 'A2', 'B1', 'B2'];

export default function LevelMenu() {
  const [current, setCurrent] = useState('A2');

  return (
    <ul className="w-16 rounded-md overflow-hidden bg-slate-800 text-center select-none">
      {levels.map((lvl, idx) => (
        <li
          key={lvl}
          onClick={() => setCurrent(lvl)}
          className={`
            py-2 border-b border-slate-700 last:border-b-0
            ${current === lvl ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}
            cursor-pointer transition-colors
          `}
        >
          {lvl}
        </li>
      ))}
    </ul>
  );
}