import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';
import { useUserKnowledge } from '../store/UserKnowledgeContext.tsx';
import { generateFromEntry, type EntryType } from '../engine/entryGenerator.ts';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { ImportDomain } from '../components/entry/ImportDomain.tsx';

const entryTypes: { value: EntryType; label: string; desc: string; icon: string }[] = [
  { value: 'question', label: 'Question', desc: 'Ask a question to explore', icon: '?' },
  { value: 'theme', label: 'Theme', desc: 'Explore a broad topic', icon: '◈' },
  { value: 'discipline', label: 'Discipline', desc: 'Start from a field of study', icon: '◎' },
  { value: 'conversation', label: 'Conversation', desc: 'Continue from discussion', icon: '⋯' },
];

export function EntryPage() {
  const navigate = useNavigate();
  const { setCenter, pool } = useConceptSpace();
  const { activateConcept, addPath, importDomain, knowledge } = useUserKnowledge();
  const [input, setInput] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('question');
  const [results, setResults] = useState<{ id: string; label: string; desc: string; domain: string }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const importedDomainNames = Object.keys(knowledge.importedDomains);

  function doSearch(query: string) {
    setLoading(true);
    setTimeout(() => {
      const q = query.toLowerCase();

      // DEBUG: Check what's in importedDomains
      const importedKeys = Object.keys(knowledge.importedDomains);
      console.log('[EntryPage] Searching:', q);
      console.log('[EntryPage] Imported domain keys:', importedKeys);
      console.log('[EntryPage] Imported domain data:', knowledge.importedDomains);
      console.log('[EntryPage] Pool concept count:', pool.concepts.length);
      console.log('[EntryPage] Pool domains:', [...new Set(pool.concepts.map(c => c.domain))]);

      // 1. Search via engine (pool already includes imported domains from context)
      const entry = generateFromEntry(query, entryType, pool);
      const conceptMap = new Map(pool.concepts.map((c) => [c.id, c]));
      const matched: { id: string; label: string; desc: string; domain: string }[] = [];

      // Collect matched concept IDs to avoid duplicates
      const seenIds = new Set<string>();
      for (const id of entry.concepts) {
        const c = conceptMap.get(id);
        if (c) {
          seenIds.add(c.id);
          matched.push({ id: c.id, label: c.label, desc: c.description, domain: c.domain });
        }
      }

      console.log('[EntryPage] Engine matched:', matched.length, 'concepts');

      // 2. Search imported domains directly (in case pool is stale or concepts weren't matched)
      for (const [domainName, domainData] of Object.entries(knowledge.importedDomains)) {
        console.log(`[EntryPage] Checking domain "${domainName}" (${domainData.concepts.length} concepts)`);
        // If query matches the domain name, show ALL concepts from that domain
        if (domainName.toLowerCase().includes(q)) {
          console.log(`[EntryPage] Domain "${domainName}" MATCHES query "${q}", adding ALL concepts`);
          for (const c of domainData.concepts) {
            if (!seenIds.has(c.id)) {
              seenIds.add(c.id);
              matched.push({ id: c.id, label: c.label, desc: c.description, domain: c.domain });
            }
          }
          continue; // Skip per-concept search below since we already added all
        }
        // Otherwise match individual concepts by label/description
        for (const c of domainData.concepts) {
          if (!seenIds.has(c.id) && (c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))) {
            console.log(`[EntryPage] Concept "${c.label}" in domain "${domainName}" matches query "${q}"`);
            seenIds.add(c.id);
            matched.push({ id: c.id, label: c.label, desc: c.description, domain: c.domain });
          }
        }
      }

      console.log('[EntryPage] Total matched:', matched.length, 'concepts');
      console.log('[EntryPage] Results labels:', matched.map(m => m.label));

      setResults(matched);
      setLoading(false);
    }, 200);
  }

  const handleSubmit = () => {
    if (!input.trim()) return;
    doSearch(input);
  };

  const handleSelectConcept = (conceptId: string) => {
    activateConcept(conceptId);
    addPath(conceptId);
    setCenter(conceptId);
    navigate('/concept-space');
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 page-enter">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
          <span className="text-2xl text-indigo-400">◈</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-slate-100">Concept Voice</h1>
        <p className="text-slate-500">Navigate the space of ideas</p>
      </div>

      {/* Entry type selector */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {entryTypes.map((et) => (
          <button
            key={et.value}
            onClick={() => { setEntryType(et.value); setResults(null); }}
            className={`group rounded-xl border p-3 text-left transition-all duration-200 ${
              entryType === et.value
                ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <span className={`text-lg ${entryType === et.value ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {et.icon}
            </span>
            <p className={`mt-1 text-sm font-medium ${entryType === et.value ? 'text-indigo-300' : 'text-slate-400'}`}>
              {et.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{et.desc}</p>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={
              entryType === 'question'
                ? 'e.g. Why do models overfit?'
                : entryType === 'theme'
                  ? 'e.g. Deep Learning'
                  : entryType === 'discipline'
                    ? 'e.g. Cognitive Science'
                    : 'e.g. What we discussed about attention...'
            }
            className="w-full rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-800/50 focus:shadow-lg focus:shadow-indigo-500/5"
          />
        </div>
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={!input.trim() || loading}>
          {loading ? 'Exploring...' : 'Explore'}
        </Button>
      </div>

      {/* Results */}
      {results && !loading && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-slate-500">Generated</span>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-sm text-indigo-300">
              {results.length} concepts
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.map((c, i) => (
              <Card
                key={c.id}
                onClick={() => handleSelectConcept(c.id)}
                className="group cursor-pointer transition-all duration-200 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200 transition-colors group-hover:text-indigo-300">
                        {c.label}
                      </span>
                      <Badge label={c.domain} variant="accent" />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
                  </div>
                  <span className="ml-3 text-slate-600 transition-colors group-hover:text-indigo-400">
                    →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="animate-fade-in-up rounded-xl border border-slate-700/30 bg-slate-800/20 p-4">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Imported domains */}
      {importedDomainNames.length > 0 && (
        <div className="mb-4 animate-fade-in">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Imported Domains</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
              {importedDomainNames.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {importedDomainNames.map((name) => {
              const domainData = knowledge.importedDomains[name];
              const count = domainData?.concepts.length ?? 0;
              return (
                <button
                  key={name}
                  onClick={() => { setInput(name); doSearch(name); }}
                  className="group rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  <p className="text-sm font-medium text-slate-200 group-hover:text-emerald-300">{name}</p>
                  <p className="text-xs text-slate-500">{count} concepts</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Import domain section */}
      <div className="mb-8 mt-6 border-t border-slate-700/30 pt-6">
        <div className="text-center">
          <p className="mb-3 text-sm text-slate-500">
            Want to explore a new field? Import a domain with AI-generated concepts.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            + Import Domain
          </Button>
        </div>
      </div>

      {showImport && (
        <ImportDomain
          onImport={(name, data) => {
            // Auto-add bridge relations to connect new domain with existing ones
            const builtinDomains = [...new Set(pool.concepts.map((c) => c.domain))];
            const newDomainConcept = data.concepts.find((c) => c.type === 'core') ?? data.concepts[0];
            for (const domain of builtinDomains) {
              const repConcept = pool.concepts.find(
                (c) => c.domain === domain && c.type === 'core'
              ) ?? pool.concepts.find((c) => c.domain === domain);
              if (repConcept) {
                data.relations.push({
                  sourceId: newDomainConcept.id,
                  targetId: repConcept.id,
                  type: 'bridge',
                  strength: 0.4,
                });
              }
            }
            importDomain(name, data);
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="mt-16 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800/30 ring-1 ring-slate-700/30">
            <span className="text-3xl text-slate-600">◈</span>
          </div>
          <p className="text-sm text-slate-600">
            Enter a question or topic to start exploring
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Try: "neural plasticity", "emergence", "decision making", "entropy"
          </p>
        </div>
      )}
    </div>
  );
}
