import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Mail } from 'lucide-react';
import { featuredProjects, type FeaturedProject } from '../data/featuredProjects';
import { experiences, testimonials } from '../data';
import { TrustField } from './TrustField';
import { Verifier } from './Verifier';
import { Pipeline } from './Pipeline';
import { ScrambleText } from '@/components/ui/scramble-text';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { TextRevealByWord } from '@/components/ui/text-reveal';
import './home.css';

const EMAIL = 'adityadeoli@gmail.com';
const LINKEDIN = 'https://linkedin.com/in/adityadeoli';
const GITHUB = 'https://github.com/deoli420';

const ease = [0.2, 0.7, 0.1, 1] as const;

const CATEGORY: Record<string, string> = {
  'blind-council-eval': 'Evaluation',
  'round-table': 'Platform',
  'ai-qa-toolkit': 'Agent tooling',
  sentinelai: 'Monitoring',
  dynotest: 'Voice AI',
  'beebom-seo-framework': 'Automation',
  'unified-automation-ai': 'AI validation',
  'automation-framework': 'Automation',
};

const PROOF = [
  ['100+', 'blind eval runs'],
  ['21', 'agent QA skills shipped'],
  ['17', 'product modules under regression'],
  ['100', 'model-launch checks'],
  ['11M', 'users protected at Intract'],
  ['$10M+', 'rewards protected'],
  ['0', 'critical escapes · 6,500+ campaigns'],
  ['1,304', 'SEO tests on a 10M-visitor site'],
];

const PRINCIPLES = [
  {
    t: 'Verify the artifact, not the claim.',
    b: 'An agent saying “tests pass” is a hypothesis. I check the files, the logs and the database before I believe it — and I build tools so nobody has to take it on faith.',
  },
  {
    t: 'Blind the judge.',
    b: 'Brand priors are strong. My eval panels never learn which model built what. In one real eval the blind panel overturned a sighted verdict and caught two scoring errors.',
  },
  {
    t: 'Compute, don’t infer.',
    b: 'A job that ran earlier is not a dependency. Root cause comes from the real graph — trajectories, CI needs, query results — never from timing or a hunch.',
  },
  {
    t: 'Make it boring to repeat.',
    b: 'Any investigation I do twice becomes a tool. That is how a QA practice turned into 21 one-command skills, a launch-check registry and an eval platform.',
  },
];

const VOICES = ['Abhishek Anita', 'Neeraj Singh', 'Kushagra', 'Vivek Kala']
  .map((n) => testimonials.find((t) => t.author === n))
  .filter(Boolean) as { quote: string; author: string; role: string }[];

/* ── helpers ─────────────────────────────────────────────── */

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.9, ease, delay }}
  >
    {children}
  </motion.div>
);

/** Decrypts its text (21st Scramble Text) the first time it scrolls into view. */
const ScrambleOnView: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: '-40px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref}>
      {seen ? <ScrambleText intervalMs={28}>{text}</ScrambleText> : <span style={{ opacity: 0 }}>{text}</span>}
    </span>
  );
};

const Label: React.FC<{ n: string; children: string }> = ({ n, children }) => (
  <div className="hp-label hp-mono">
    <span>{n}</span>
    <ScrambleOnView text={children} />
  </div>
);

const useIstClock = () => {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date());
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 15000);
    return () => clearInterval(id);
  }, []);
  return time;
};

/* ── sections ────────────────────────────────────────────── */

const Nav: React.FC = () => {
  const time = useIstClock();
  return (
    <nav className="hp-nav hp-mono" aria-label="Primary">
      <a href="#top" className="hp-nav__name" style={{ fontFamily: 'var(--sans)' }}>Aditya Deoli</a>
      <div className="hp-nav__links">
        <a href="#principles">Principles</a>
        <a href="#pipeline">Pipeline</a>
        <a href="#systems">Systems</a>
        <a href="#experience">Experience</a>
        <Link to="/casestudies">Case studies</Link>
        <a href="#contact">Contact</a>
      </div>
      <div className="hp-nav__clock"><span className="hp-dot" /> IST {time}</div>
    </nav>
  );
};

const Hero: React.FC = () => {
  const lines = [
    <span key="a"><em>Trust</em> is an</span>,
    <span key="b">engineering</span>,
    <span key="c">problem.</span>,
  ];
  return (
    <header id="top" className="hp-hero">
      <div className="hp-hero__canvas"><TrustField /></div>
      <div className="hp-hero__fade" />
      <div className="hp-wrap hp-hero__inner" style={{ width: '100%' }}>
        <motion.div
          className="hp-eyebrow hp-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span>Aditya Deoli</span>
          <ScrambleText intervalMs={30}>Member of Technical Staff — Emergent</ScrambleText>
          <span className="hp-ok">● Building agent reliability</span>
        </motion.div>

        <h1 className="hp-h1">
          {lines.map((l, i) => (
            <span className="hp-line" key={i}>
              <motion.span
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease, delay: 0.25 + i * 0.12 }}
              >
                {l}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="hp-hero__grid">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.8 }}>
            <p className="hp-lede">
              I build the systems that make <strong>AI agents trustworthy</strong> — blind evals, verification
              pipelines and test automation for an AI platform that builds apps from a prompt.
            </p>
            <div className="hp-ctas">
              <MagneticButton distance={0.35}>
                <a className="hp-btn hp-btn--solid" href="#pipeline">See how I verify <ArrowDown /></a>
              </MagneticButton>
              <MagneticButton distance={0.35}>
                <a className="hp-btn" href={`mailto:${EMAIL}`}>Get in touch <ArrowUpRight /></a>
              </MagneticButton>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease, delay: 1 }}>
            <Verifier />
          </motion.div>
        </div>

        <div className="hp-scrollcue hp-mono">
          <span className="hp-scrollcue__hint">Move the cursor — the lens verifies what it touches</span>
          <span>Scroll ↓</span>
        </div>
      </div>
    </header>
  );
};

const Ticker: React.FC = () => {
  const items = [...PROOF, ...PROOF];
  return (
    <section className="hp-ticker" aria-label="Proof points">
      <div className="hp-ticker__track">
        {items.map(([num, label], i) => (
          <span key={i} className="hp-ticker__item" aria-hidden={i >= PROOF.length}>
            <span className="hp-ticker__num">{num}</span>
            <span className="hp-ticker__label">{label}</span>
            <span className="hp-ticker__sep">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
};

const Principles: React.FC = () => (
  <section id="principles" className="hp-section hp-wrap">
    <Label n="01">Principles</Label>
    <Reveal>
      <h2 className="hp-h2">How I make agents <em>earn</em> trust.</h2>
    </Reveal>
    <div className="hp-principles">
      {PRINCIPLES.map((p, i) => (
        <Reveal key={p.t} className="hp-principle" delay={(i % 2) * 0.08}>
          <div className="hp-principle__n hp-mono">0{i + 1}</div>
          <h3 className="hp-principle__t">{p.t}</h3>
          <p className="hp-principle__b">{p.b}</p>
        </Reveal>
      ))}
    </div>
  </section>
);

const SystemRow: React.FC<{ p: FeaturedProject; i: number; onHover: (p: FeaturedProject | null) => void }> = ({ p, i, onHover }) => {
  const inner = (
    <>
      <span className="hp-row__n hp-mono">{String(i + 1).padStart(2, '0')}</span>
      <span className="hp-row__title">
        {p.title}
        {p.context && <span className="hp-row__badge hp-mono">Emergent</span>}
      </span>
      <span className="hp-row__tag">{p.tagline}</span>
      <span className="hp-row__metrics hp-mono">
        {p.metrics.slice(0, 2).map((m) => (
          <span key={m.label}><b>{m.value}</b> {m.label}</span>
        ))}
      </span>
      <span className="hp-row__cat hp-mono">{CATEGORY[p.slug] ?? 'System'}</span>
      <span className="hp-row__arrow">{(p.detailPath || p.githubUrl) ? <ArrowUpRight size={20} /> : null}</span>
    </>
  );
  const common = {
    className: 'hp-row',
    onMouseEnter: () => onHover(p),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(p),
    onBlur: () => onHover(null),
  };
  const row = p.detailPath ? (
    <Link to={p.detailPath} {...common}>{inner}</Link>
  ) : p.githubUrl ? (
    <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" {...common}>{inner}</a>
  ) : (
    <div tabIndex={0} {...common} style={{ cursor: 'default' }}>{inner}</div>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease, delay: Math.min(i, 4) * 0.05 }}
    >
      {row}
    </motion.div>
  );
};

const Systems: React.FC = () => {
  const [active, setActive] = useState<FeaturedProject | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28 });
  const sy = useSpring(y, { stiffness: 260, damping: 28 });
  const fine = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches);

  useEffect(() => {
    if (!fine.current) return;
    const move = (e: PointerEvent) => {
      const w = 340;
      x.set(Math.min(e.clientX + 28, window.innerWidth - w - 16));
      y.set(Math.min(e.clientY + 20, window.innerHeight - 330));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);

  return (
    <section id="systems" className="hp-section hp-wrap">
      <Label n="03">Selected systems</Label>
      <Reveal>
        <h2 className="hp-h2">Things I built so I could <em>stop guessing.</em></h2>
      </Reveal>
      <div className="hp-index">
        {featuredProjects.map((p, i) => (
          <SystemRow key={p.slug} p={p} i={i} onHover={setActive} />
        ))}
      </div>

      {fine.current && (
        <AnimatePresence>
          {active && (
            <motion.div
              key={active.slug}
              className="hp-preview"
              style={{ x: sx, y: sy }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease }}
              aria-hidden="true"
            >
              <p className="hp-preview__desc">{active.description}</p>
              <div className="hp-preview__metrics">
                {active.metrics.map((m) => (
                  <div key={m.label} className="hp-preview__m">
                    <div className="hp-preview__mv">{m.value}</div>
                    <div className="hp-preview__ml">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="hp-preview__tech">{active.techHighlights.join(' · ')}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
};

const Statement: React.FC = () => (
  <section className="hp-wrap" aria-label="What I do">
    <TextRevealByWord
      text="Agents write the code now. Someone has to prove it works. I build the checks, the judges and the pipelines that decide when an AI's output has earned trust."
      textClassName="hp-statement"
      accentWords={['prove', 'earned', 'trust']}
      accentClassName="hp-statement__accent"
    />
  </section>
);

const PipelineSection: React.FC = () => (
  <section id="pipeline" className="hp-section hp-wrap">
    <Label n="02">How a run gets verified</Label>
    <Reveal>
      <h2 className="hp-h2">No claim ships <em>on faith.</em></h2>
    </Reveal>
    <Reveal delay={0.1}>
      <Pipeline />
      <div className="hp-pipe__legend hp-mono">
        <span><i style={{ background: 'var(--ok)' }} />evidence flowing forward</span>
        <span><i style={{ background: 'var(--bad)' }} />failed check → back to the agent</span>
      </div>
    </Reveal>
  </section>
);

const ExperienceSection: React.FC = () => (
  <section id="experience" className="hp-section hp-wrap">
    <Label n="04">Experience</Label>
    <Reveal>
      <h2 className="hp-h2">From breaking products to <em>verifying agents.</em></h2>
    </Reveal>
    <div className="hp-timeline">
      {experiences.map((e, i) => (
        <Reveal key={e.company} className="hp-job" delay={i * 0.05}>
          <div className="hp-job__period hp-mono">
            {e.period.includes('Present') ? <span className="hp-job__now">● {e.period}</span> : e.period}
          </div>
          <div>
            <div className="hp-job__co">{e.company}</div>
            <div className="hp-job__role hp-mono">{e.role}</div>
          </div>
          <ul>
            {e.achievements.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </Reveal>
      ))}
    </div>
  </section>
);

const Voices: React.FC = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((i + 1) % VOICES.length), 7000);
    return () => clearTimeout(id);
  }, [i]);
  const v = VOICES[i];
  return (
    <section className="hp-section hp-wrap" aria-label="What people say">
      <Label n="05">Said by people I shipped with</Label>
      <div className="hp-voice" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.figure
            key={v.author}
            style={{ margin: 0 }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease }}
          >
            <blockquote className="hp-voice__q">{v.quote}</blockquote>
            <figcaption className="hp-voice__by hp-mono">
              <span style={{ color: 'var(--ink)' }}>{v.author}</span>
              <span>— {v.role}</span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
        <div className="hp-voice__nav">
          {VOICES.map((q, k) => (
            <button
              key={q.author}
              className="hp-voice__dot"
              aria-label={`Quote from ${q.author}`}
              aria-current={k === i}
              onClick={() => setI(k)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Closing: React.FC = () => (
  <section id="contact" className="hp-close hp-wrap">
    <Label n="06">Contact</Label>
    <Reveal>
      <h2 className="hp-close__h">Shipping agents?<br />Let’s make them <em>trustworthy.</em></h2>
    </Reveal>
    <Reveal delay={0.1}>
      <MagneticButton distance={0.15}>
        <a className="hp-mail" href={`mailto:${EMAIL}`}>
          <Mail size={28} strokeWidth={1.5} /> {EMAIL} <ArrowUpRight size={28} strokeWidth={1.5} />
        </a>
      </MagneticButton>
    </Reveal>
    <footer className="hp-foot hp-mono">
      <span>© {new Date().getFullYear()} Aditya Deoli</span>
      <div className="hp-foot__links">
        <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <Link to="/casestudies">Case studies</Link>
        <Link to="/logs">Logs</Link>
      </div>
      <span>Designed &amp; built by hand. Set in Inter Tight, Instrument Serif &amp; JetBrains Mono.</span>
    </footer>
  </section>
);

export const HomePage: React.FC = () => {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#0a0a0b';
    return () => { document.body.style.background = prev; };
  }, []);

  return (
    <main className="hp">
      <div className="hp-grain" aria-hidden="true" />
      <Nav />
      <Hero />
      <Ticker />
      <Statement />
      <Principles />
      <PipelineSection />
      <Systems />
      <ExperienceSection />
      <Voices />
      <Closing />
    </main>
  );
};
