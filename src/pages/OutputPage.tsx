import { useMemo, useState } from 'react';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';
import { useUserKnowledge } from '../store/UserKnowledgeContext.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';

export function OutputPage() {
  const { pool } = useConceptSpace();
  const { knowledge } = useUserKnowledge();
  const conceptMap = useMemo(
    () => new Map(pool.concepts.map((c) => [c.id, c])),
    [pool.concepts],
  );
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'graph' | 'paths' | 'structures' | 'full'>('full');

  const activeCount = Object.keys(knowledge.activations).length;
  const hasData = activeCount > 0 || knowledge.structures.length > 0;

  const generateMarkdown = (): string => {
    const lines: string[] = ['# Concept Voice — Knowledge Export', ''];

    if (format === 'full' || format === 'graph') {
      lines.push('## Concept Graph', '');
      lines.push('| Concept | Domain | Strength | Visits |');
      lines.push('|---------|--------|----------|--------|');
      for (const [id, act] of Object.entries(knowledge.activations)) {
        const c = conceptMap.get(id);
        if (!c) continue;
        lines.push(
          `| ${c.label} | ${c.domain} | ${Math.round(act.strength * 100)}% | ${act.visitCount} |`,
        );
      }
      lines.push('');

      if (knowledge.connections.length > 0) {
        lines.push('### Connections', '');
        for (const conn of knowledge.connections) {
          const s = conceptMap.get(conn.sourceId);
          const t = conceptMap.get(conn.targetId);
          lines.push(`- ${s?.label ?? conn.sourceId} —${conn.type}→ ${t?.label ?? conn.targetId}`);
        }
        lines.push('');
      }
    }

    if (format === 'full' || format === 'paths') {
      lines.push('## Exploration Paths', '');
      if (knowledge.paths.length === 0) {
        lines.push('*No paths recorded*', '');
      }
      for (const path of knowledge.paths) {
        const labels = path.steps
          .map((s) => conceptMap.get(s.conceptId)?.label ?? s.conceptId)
          .join(' → ');
        lines.push(`- ${labels}`);
      }
      lines.push('');
    }

    if (format === 'full' || format === 'structures') {
      lines.push('## Synthesized Structures', '');
      if (knowledge.structures.length === 0) {
        lines.push('*No structures synthesized*', '');
      }
      for (const s of knowledge.structures) {
        const labels = s.conceptIds.map((id) => conceptMap.get(id)?.label ?? id).join(', ');
        lines.push(`- **${s.label}**: ${labels}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concept-voice-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasData) {
    return (
      <EmptyState
        title="Nothing to export yet"
        description="Activate concepts and build structures to generate knowledge output"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 page-enter">
      <h2 className="mb-1 text-xl font-semibold text-slate-100">Knowledge Output</h2>
      <p className="mb-6 text-sm text-slate-500">Export your concept graph as Markdown</p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-400">{activeCount}</p>
          <p className="text-xs text-slate-500">Activated</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-400">{knowledge.connections.length}</p>
          <p className="text-xs text-slate-500">Connections</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-400">{knowledge.structures.length}</p>
          <p className="text-xs text-slate-500">Structures</p>
        </Card>
      </div>

      {/* Format selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['full', 'graph', 'paths', 'structures'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              format === f
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-sm'
                : 'border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Preview */}
      <Card className="mb-6">
        <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm text-slate-400 font-mono leading-relaxed">
          {generateMarkdown()}
        </pre>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleCopy}>
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </Button>
        <Button variant="secondary" onClick={handleDownload}>
          Download .md
        </Button>
      </div>
    </div>
  );
}
