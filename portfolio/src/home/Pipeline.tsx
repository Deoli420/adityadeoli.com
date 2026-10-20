import React, { useRef } from 'react';
import { Bot, ShieldCheck, FlaskConical, ScanEye, Scale, BadgeCheck } from 'lucide-react';
import { AnimatedBeam } from '@/components/ui/animated-beam';

type NodeProps = {
  nodeRef: React.RefObject<HTMLDivElement>;
  icon: React.ElementType;
  title: string;
  sub: string;
  tone?: 'ok' | 'agent';
  className?: string;
};

const Node: React.FC<NodeProps> = ({ nodeRef, icon: Icon, title, sub, tone, className }) => (
  <div ref={nodeRef} className={`hp-node${tone ? ` hp-node--${tone}` : ''}${className ? ` ${className}` : ''}`}>
    <span className="hp-node__icon"><Icon size={18} strokeWidth={1.6} /></span>
    <span>
      <span className="hp-node__title">{title}</span>
      <span className="hp-node__sub hp-mono">{sub}</span>
    </span>
  </div>
);

const OK = '#c6ff3d';
const BAD = '#ff5a36';

/** How one agent run earns trust: every claim passes through independent checks before it ships. */
export const Pipeline: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);
  const agent = useRef<HTMLDivElement>(null);
  const statics = useRef<HTMLDivElement>(null);
  const suite = useRef<HTMLDivElement>(null);
  const audit = useRef<HTMLDivElement>(null);
  const judges = useRef<HTMLDivElement>(null);
  const trusted = useRef<HTMLDivElement>(null);

  const checks = [statics, suite, audit, judges];
  const beam = { pathColor: '#ecebe6', pathOpacity: 0.16, pathWidth: 2, gradientStartColor: OK, gradientStopColor: '#ecebe6' };

  return (
    <div ref={container} className="hp-pipe">
      <div className="hp-pipe__col">
        <Node nodeRef={agent} icon={Bot} title="Agent run" sub="code · tool calls · claims" tone="agent" />
      </div>
      <div className="hp-pipe__col hp-pipe__checks">
        <Node nodeRef={statics} icon={ShieldCheck} title="Static checks" sub="lint · types · API contracts" />
        <Node nodeRef={suite} icon={FlaskConical} title="Regression suite" sub="AI-driven E2E · 17 modules" />
        <Node nodeRef={audit} icon={ScanEye} title="Trajectory audit" sub="leaks · secrets · false claims" />
        <Node nodeRef={judges} icon={Scale} title="Blind judge panel" sub="multi-model · identity-scrubbed" />
      </div>
      <div className="hp-pipe__col">
        <Node nodeRef={trusted} icon={BadgeCheck} title="Trusted" sub="ships with evidence" tone="ok" />
      </div>

      {checks.map((c, i) => (
        <AnimatedBeam key={`in-${i}`} containerRef={container} fromRef={agent} toRef={c} duration={3.2} delay={i * 0.35} {...beam} />
      ))}
      {checks.map((c, i) => (
        <AnimatedBeam key={`out-${i}`} containerRef={container} fromRef={c} toRef={trusted} duration={3.2} delay={1.4 + i * 0.35} {...beam} />
      ))}
      {/* a failed check sends the run back to the agent */}
      <AnimatedBeam
        containerRef={container}
        fromRef={suite}
        toRef={agent}
        reverse
        curvature={-70}
        duration={4.5}
        delay={2.2}
        pathColor={BAD}
        pathOpacity={0.2}
        pathWidth={2}
        gradientStartColor={BAD}
        gradientStopColor="#ff9a7e"
      />
    </div>
  );
};
