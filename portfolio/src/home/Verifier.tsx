import React, { useEffect, useState } from 'react';

type Status = 'ok' | 'bad' | 'info';
interface Line { who: 'agent' | 'verify'; what: string; result?: string; status?: Status; verdict?: boolean }

// A simulated agent trajectory: the agent claims success, the verifier checks the artifact.
const SCRIPT: Line[] = [
  { who: 'agent', what: 'create_file  src/api/checkout.ts' },
  { who: 'verify', what: 'lint', result: '✓ pass', status: 'ok' },
  { who: 'verify', what: 'contract  openapi.yaml', result: '✓ pass', status: 'ok' },
  { who: 'agent', what: 'claim  "all tests pass"' },
  { who: 'verify', what: 'run tests', result: '✗ 3 / 12', status: 'bad' },
  { who: 'verify', what: 'claim rejected — sent back with failures', status: 'bad', verdict: true },
  { who: 'agent', what: 'edit_file  src/api/checkout.ts' },
  { who: 'verify', what: 'run tests', result: '✓ 12 / 12', status: 'ok' },
  { who: 'verify', what: 'scan output for secrets', result: '✓ 0 leaks', status: 'ok' },
  { who: 'verify', what: 'trajectory trusted', result: '●', status: 'ok', verdict: true },
];

export const Verifier: React.FC = () => {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced ? SCRIPT.length : 0);

  useEffect(() => {
    if (reduced) return;
    const done = shown >= SCRIPT.length;
    const prev = SCRIPT[shown - 1];
    const delay = done ? 4200 : prev?.verdict ? 1300 : prev?.who === 'agent' ? 900 : 560;
    const id = setTimeout(() => setShown(done ? 0 : shown + 1), delay);
    return () => clearTimeout(id);
  }, [shown, reduced]);

  const lines = SCRIPT.slice(0, shown);
  const rejected = lines.some((l) => l.status === 'bad');
  const trusted = shown >= SCRIPT.length;

  return (
    <div className="hp-verifier" role="img" aria-label="Simulated agent trajectory: an agent claims all tests pass, the verifier finds 3 failing, rejects the claim, and trusts the run only after the agent fixes it.">
      <div className="hp-verifier__bar">
        <span>trajectory.verify()</span>
        <span>simulated</span>
      </div>
      <div className="hp-verifier__body" aria-hidden="true">
        {lines.map((l, i) => (
          <div key={i} className={`hp-vline${l.verdict ? ' hp-vline--verdict' : ''}`}>
            <span className="hp-vline__who">{l.who}</span>
            <span className={`hp-vline__what${l.verdict ? (l.status === 'bad' ? ' hp-bad' : ' hp-ok') : ''}`}>{l.what}</span>
            <span className={l.status === 'ok' ? 'hp-ok' : l.status === 'bad' ? 'hp-bad' : ''}>{l.result}</span>
          </div>
        ))}
        {!trusted && <span className="hp-caret" />}
      </div>
      <div className="hp-verifier__foot" aria-hidden="true">
        <span>claims checked <span className="hp-ok">{lines.filter((l) => l.who === 'verify').length}</span></span>
        <span>rejected <span className={rejected ? 'hp-bad' : ''}>{rejected ? 1 : 0}</span></span>
        <span>status {trusted ? <span className="hp-ok">trusted</span> : 'verifying…'}</span>
      </div>
    </div>
  );
};
