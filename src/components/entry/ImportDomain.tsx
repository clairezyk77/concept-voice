import { useState } from 'react';
import type { SeedPool, Concept, Relation } from '../../types/concept.ts';

interface ImportDomainProps {
  onImport: (domainName: string, data: SeedPool) => void;
  onClose: () => void;
}

function generatePrompt(domainName: string): string {
  return `You are a knowledge engineer. Generate a JSON structure for the domain "${domainName}" that can be used in a concept navigation system.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:

{
  "concepts": [
    {
      "id": "short-kebab-id",
      "label": "Display Name",
      "description": "One-line description of the concept",
      "domain": "${domainName}",
      "type": "core" | "bridge" | "domain"
    }
  ],
  "relations": [
    {
      "sourceId": "id-of-source-concept",
      "targetId": "id-of-target-concept",
      "type": "hierarchy" | "neighborhood" | "bridge" | "process" | "composition" | "contrast",
      "strength": 0.8
    }
  ]
}

Requirements:
- Generate 15-25 core concepts for ${domainName}
- Each concept must have a unique kebab-case id (e.g. "convolutional-neural-network")
- description should be 5-15 words, informative
- type "core" = fundamental concept, "bridge" = connects across domains, "domain" = broad field label
- Generate 25-40 relations between concepts — make sure EVERY concept has at least 2 relations
- Relation types: hierarchy (is-a / category-of), neighborhood (related/sibling), bridge (cross-domain connector), process (leads-to / produces / causes), composition (part-of / component-of), contrast (vs / opposite)
- strength is 0-1, higher = stronger relation (use 0.7-0.9 for strong direct relations, 0.4-0.6 for weaker ones)
- Cover the key theories, phenomena, researchers, sub-fields, and foundational concepts
- IMPORTANT: Make sure every sourceId and targetId in relations exactly matches a concept id from the concepts list

Example concept:
{"id": "neural-plasticity", "label": "Neural Plasticity", "description": "The brain's ability to reorganize itself by forming new neural connections", "domain": "${domainName}", "type": "core"}

Example relation:
{"sourceId": "neural-plasticity", "targetId": "synaptic-pruning", "type": "process", "strength": 0.8}

Now generate the JSON for ${domainName}:`;
}

function findUnconnected(concepts: any[], relations: any[]): string[] {
  const connected = new Set<string>();
  for (const r of relations) {
    connected.add(r.sourceId);
    connected.add(r.targetId);
  }
  return concepts.filter((c) => !connected.has(c.id)).map((c) => c.label);
}

function validateDomainData(data: unknown, domainName: string): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Not a valid JSON object' };

  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.concepts)) return { valid: false, error: 'Missing or invalid "concepts" array' };
  if (!Array.isArray(d.relations)) return { valid: false, error: 'Missing or invalid "relations" array' };

  for (const c of d.concepts) {
    if (!c.id || !c.label || !c.description || !c.domain || !c.type) {
      return { valid: false, error: `Concept "${c.label || '(unnamed)'}" is missing required fields (id, label, description, domain, type)` };
    }
    if (!['core', 'bridge', 'domain'].includes(c.type)) {
      return { valid: false, error: `Concept "${c.label}" has invalid type "${c.type}"` };
    }
  }

  const conceptIds = new Set(d.concepts.map((c: any) => c.id));
  for (const r of d.relations) {
    if (!r.sourceId || !r.targetId || !r.type) {
      return { valid: false, error: `Relation missing required fields (sourceId, targetId, type) — got ${JSON.stringify(r)}` };
    }
    if (typeof r.strength !== 'number' || r.strength < 0 || r.strength > 1) {
      return { valid: false, error: `Relation strength must be a number between 0 and 1 — got "${r.strength}"` };
    }
    if (!['hierarchy', 'neighborhood', 'bridge', 'process', 'composition', 'contrast'].includes(r.type)) {
      return { valid: false, error: `Invalid relation type "${r.type}". Must be one of: hierarchy, neighborhood, bridge, process, composition, contrast` };
    }
    if (!conceptIds.has(r.sourceId)) {
      return { valid: false, error: `Relation sourceId "${r.sourceId}" not found in concepts` };
    }
    if (!conceptIds.has(r.targetId)) {
      return { valid: false, error: `Relation targetId "${r.targetId}" not found in concepts` };
    }
  }

  if (d.concepts.length < 5) return { valid: false, error: 'At least 5 concepts required' };

  // Warn about unconnected concepts (not a hard error)
  const unconnected = findUnconnected(d.concepts, d.relations);
  if (unconnected.length > 0) {
    return { valid: false, error: `These concepts have no relations: ${unconnected.join(', ')}. Every concept needs at least one relation.` };
  }

  return { valid: true };
}

export function ImportDomain({ onImport, onClose }: ImportDomainProps) {
  const [step, setStep] = useState<'domain' | 'prompt' | 'paste'>('domain');
  const [domainName, setDomainName] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);

  const prompt = domainName ? generatePrompt(domainName) : '';

  // Strip markdown code fences and extract JSON
  function extractJson(raw: string): string {
    // Remove ```json ... ``` or ``` ... ``` blocks
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    // Try to find { ... } directly
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) return braceMatch[0];
    return raw.trim();
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setStep('paste');
    } catch {
      // Fallback: select the textarea content
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = () => {
    setError(null);
    try {
      const cleaned = extractJson(jsonInput);
      const parsed = JSON.parse(cleaned);
      const validation = validateDomainData(parsed, domainName);
      if (!validation.valid) {
        setError(validation.error!);
        return;
      }
      setImporting(true);
      onImport(domainName, parsed as SeedPool);
      // Small delay to show success state
      setTimeout(() => onClose(), 800);
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
    }
  };

  const handleReset = () => {
    setStep('domain');
    setDomainName('');
    setJsonInput('');
    setError(null);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-2xl border border-slate-700/50 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Import New Domain</h2>
            <p className="mt-1 text-sm text-slate-500">
              {step === 'domain' && 'Enter a domain name to get started'}
              {step === 'prompt' && 'Copy the prompt and send it to an AI'}
              {step === 'paste' && 'Paste the AI-generated JSON below'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="mb-6 flex items-center gap-2">
          {['domain', 'prompt', 'paste'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                step === s
                  ? 'bg-indigo-500 text-white'
                  : ['domain', 'prompt', 'paste'].indexOf(step) > i
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-slate-800 text-slate-600'
              }`}>
                {['domain', 'prompt', 'paste'].indexOf(step) > i ? '✓' : i + 1}
              </span>
              <span className={`text-xs ${step === s ? 'text-slate-300' : 'text-slate-600'}`}>
                {s === 'domain' ? 'Name' : s === 'prompt' ? 'Prompt' : 'Import'}
              </span>
              {i < 2 && <div className="mx-1 h-px w-6 bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* Step 1: Domain name */}
        {step === 'domain' && (
          <div className="space-y-4">
            <input
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && domainName.trim() && setStep('prompt')}
              placeholder="e.g. Quantum Computing, Ecology, Economics..."
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800/50"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!domainName.trim()}
                onClick={() => setStep('prompt')}
              >
                Generate Prompt →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Show prompt */}
        {step === 'prompt' && (
          <div className="space-y-4">
            <div className="relative">
              <pre className="max-h-64 overflow-auto rounded-xl border border-slate-700/50 bg-slate-950 p-4 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                {prompt}
              </pre>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>← Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy Prompt'}
                </Button>
                <Button variant="primary" size="sm" onClick={() => setStep('paste')}>
                  I have the JSON →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Paste JSON */}
        {step === 'paste' && (
          <div className="space-y-4">
            <textarea
              value={jsonInput}
              onChange={(e) => { setJsonInput(e.target.value); setError(null); }}
              placeholder="Paste the JSON generated by the AI here..."
              className="h-48 w-full rounded-xl border border-slate-700/50 bg-slate-950 p-4 text-xs text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 font-mono resize-none"
              autoFocus
            />
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('prompt')}>← Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleReset}>Reset</Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!jsonInput.trim() || importing}
                  onClick={handleImport}
                >
                  {importing ? 'Importing...' : 'Import Domain'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success state handled by auto-close */}
      </div>
    </div>
  );
}

function Button({ variant, size, children, onClick, disabled, className = '' }: {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const base = 'rounded-lg font-medium transition-all duration-200 outline-none';
  const sizes = { sm: 'px-3 py-1.5 text-xs', lg: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed',
    secondary: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50',
    ghost: 'text-slate-500 hover:text-slate-300',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
