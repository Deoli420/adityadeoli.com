import React, { useEffect, useState } from 'react';

type Step = { label: string; detail: string; status: 'ok' | 'bad' | 'neutral' };

// A simulated agent run moving through verification, CI-style.
const STEPS: Step[] = [
  { label: 'agent.claim', detail: '"all tests pass"', status: 'neutral' },
  { label: 'lint', detail: '✓ pass', status: 'ok' },
  { label: 'contract', detail: '✓ openapi', status: 'ok' },
  { label: 'tests', detail: '✗ 3 / 12', status: 'bad' },
  { label: 'agent.fix', detail: 'checkout.ts', status: 'neutral' },
  { label: 'tests', detail: '✓ 12 / 12', status: 'ok' },
  { label: 'leak scan', detail: '✓ 0 found', status: 'ok' },
  { label: 'trusted', detail: '● ship it', status: 'ok' },
];

export const RunStrip: React.FC<{ running: boolean }> = ({ running }) => {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [i, setI] = useState(reduced ? STEPS.length - 1 : -1);

  useEffect(() => {
    if (!running || reduced) return;
    const last = i >= STEPS.length - 1;
    const delay = i < 0 ? 500 : last ? 3600 : STEPS[i].status === 'bad' ? 1400 : 720;
    const id = setTimeout(() => setI(last ? -1 : i + 1), delay);
    return () => clearTimeout(id);
  }, [i, running, reduced]);

  const progress = Math.max(0, i + 1) / STEPS.length;
  const failed = i >= 3 && i < 5;
  const trusted = i === STEPS.length - 1;

  return (
    <div
      className="hp-run"
      role="img"
      aria-label="Simulated agent run: the agent claims all tests pass, verification finds 3 failing, sends it back, and the run is trusted only after the fix passes every check."
    >
      <div className="hp-run__head hp-mono" aria-hidden="true">
        <span><span className={`hp-run__pulse${trusted ? ' is-ok' : failed ? ' is-bad' : ''}`} /> run #4127 · simulated</span>
        <span className={trusted ? 'hp-ok' : failed ? 'hp-bad' : ''}>
          {trusted ? 'trusted' : failed ? 'claim rejected → sent back' : i < 0 ? 'queued' : 'verifying…'}
        </span>
      </div>
      <div className="hp-run__track" aria-hidden="true">
        <i className={failed ? 'is-bad' : ''} style={{ transform: `scaleX(${progress})` }} />
      </div>
      <ol className="hp-run__steps" aria-hidden="true">
        {STEPS.map((s, k) => (
          <li
            key={k}
            className={[
              k <= i ? 'is-done' : '',
              k === i ? 'is-active' : '',
              k <= i ? `is-${s.status}` : '',
            ].join(' ')}
          >
            <span className="hp-run__label hp-mono">{s.label}</span>
            <span className="hp-run__detail hp-mono">{k <= i ? s.detail : '—'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
