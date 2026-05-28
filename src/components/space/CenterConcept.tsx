import { useState } from 'react';
import type { Concept } from '../../types/concept.ts';
import { Badge } from '../ui/Badge.tsx';
import { speak } from '../../engine/speak.ts';

interface CenterConceptProps {
  concept: Concept;
}

export function CenterConcept({ concept }: CenterConceptProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    setSpeaking(true);
    speak(`${concept.label}: ${concept.description}`);
    setTimeout(() => setSpeaking(false), 1500);
  };

  return (
    <div className="flex items-center gap-4 animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/5">
        <span className="text-lg font-bold text-indigo-300">
          {concept.label.charAt(0)}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-100">{concept.label}</h2>
          <Badge label={concept.domain} variant="accent" />
          <Badge label={concept.type} variant="primary" />
          {/* Speaker button */}
          <button
            onClick={handleSpeak}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200 text-xs"
            title="Read aloud"
          >
            {speaking ? '...' : '♪'}
          </button>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">{concept.description}</p>
      </div>
    </div>
  );
}
