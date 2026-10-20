import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';

/**
 * Agent swarm: thousands of particles drift in chaos (an unverified agent),
 * snap into a shape once the page is "verified", then morph between shapes.
 * Particles near the cursor scatter and turn signal-green. Scrolling the hero
 * away blows the swarm apart.
 *
 * Everything runs in one vertex shader; the CPU only moves uniforms and swaps
 * the target buffers between morphs.
 */

type Shape = 'name' | 'trust' | 'check';
const SEQUENCE: Shape[] = ['name', 'trust', 'check'];
const HOLD_MS: Record<Shape, number> = { name: 5200, trust: 4600, check: 3200 };
const MORPH_MS = 1700;
const FORM_MS = 1900;

const VERT = /* glsl */ `
  attribute vec2 aFrom;
  attribute vec2 aTo;
  attribute vec2 aChaos;
  attribute vec4 aRand; // x,y: random 0..1   z,w: random unit direction

  uniform float uTime, uForm, uMorph, uScatter, uMouseR, uDpr, uSize;
  uniform vec2 uRes, uMouse, uCenter;

  varying float vLens;
  varying float vAlpha;
  varying float vForm;

  float ease(float t) { return t < .5 ? 4. * t * t * t : 1. - pow(-2. * t + 2., 3.) / 2.; }

  void main() {
    float r = aRand.x;

    // chaos: a slow galaxy swirl around the hero centre, with per-particle wobble
    float spin = uTime * .12 * (.35 + aRand.y);
    float cs = cos(spin), sn = sin(spin);
    vec2 c = aChaos - uCenter;
    float ang = uTime * (.25 + .5 * aRand.y) + r * 6.2831;
    vec2 chaos = uCenter + mat2(cs, -sn, sn, cs) * c + vec2(sin(ang * 1.7), cos(ang * 1.3)) * 28.;

    // morph between two shapes, staggered per particle, with an outward arc mid-flight
    float m = ease(clamp((uMorph - r * .35) / .65, 0., 1.));
    vec2 shape = mix(aFrom, aTo, m) + aRand.zw * sin(m * 3.14159) * 110.;
    shape += vec2(sin(uTime * 1.7 + r * 40.), cos(uTime * 1.3 + r * 31.)) * .9;

    float f = ease(clamp((uForm - r * .4) / .6, 0., 1.));
    vec2 pos = mix(chaos, shape, f);

    // cursor lens: push away and light up
    vec2 d = pos - uMouse;
    float dist = length(d);
    float push = smoothstep(uMouseR, 0., dist);
    pos += (d / (dist + .001)) * push * 48.;
    vLens = smoothstep(uMouseR * 1.5, uMouseR * .15, dist);

    // scroll: blow the swarm apart
    pos += aRand.zw * uScatter * (500. + 600. * aRand.y);

    vAlpha = (.55 + .45 * f) * (1. - uScatter * .95);
    vForm = f;

    gl_Position = vec4(pos.x / uRes.x * 2. - 1., 1. - pos.y / uRes.y * 2., 0., 1.);
    gl_PointSize = uSize * uDpr * (.65 + aRand.y * .9) * (1. + vLens * .9);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uInk, uOk;
  varying float vLens;
  varying float vAlpha;
  varying float vForm;

  void main() {
    float d = length(gl_PointCoord - .5);
    float a = smoothstep(.5, .05, d);
    vec3 col = mix(uInk * mix(.8, 1., vForm), uOk, vLens);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

/** Rasterise a shape into a region and return `count` (x, y) points inside it. */
function sampleShape(shape: Shape, w: number, h: number, count: number, narrow: boolean): Float32Array {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.floor(w));
  cv.height = Math.max(1, Math.floor(h));
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  const fitText = (lines: string[], font: (px: number) => string, maxH: number) => {
    g.font = font(100);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    const byW = (w * 0.94) / widest * 100;
    const byH = (maxH / lines.length) / 1.0;
    const px = Math.min(byW, byH);
    g.font = font(px);
    const lh = px * 0.98;
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh));
  };

  if (shape === 'name') {
    fitText(narrow ? ['Aditya', 'Deoli'] : ['Aditya Deoli'], (px) => `600 ${px}px "Inter Tight", system-ui, sans-serif`, h * 0.92);
  } else if (shape === 'trust') {
    fitText(['Trust.'], (px) => `italic 400 ${px}px "Instrument Serif", serif`, h * 1.05);
  } else {
    const s = Math.min(w, h) * 0.8;
    const cx = w / 2, cy = h / 2;
    g.lineWidth = s * 0.085;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.arc(cx, cy, s / 2 - g.lineWidth, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(cx - s * 0.2, cy + s * 0.01);
    g.lineTo(cx - s * 0.05, cy + s * 0.16);
    g.lineTo(cx + s * 0.22, cy - s * 0.14);
    g.stroke();
  }

  const data = g.getImageData(0, 0, cv.width, cv.height).data;
  const step = narrow ? 2 : 3;
  const pts: number[] = [];
  for (let y = 0; y < cv.height; y += step) {
    for (let x = 0; x < cv.width; x += step) {
      if (data[(y * cv.width + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }
  const out = new Float32Array(count * 2);
  const n = pts.length / 2;
  for (let i = 0; i < count; i++) {
    const k = n ? Math.floor(Math.random() * n) : 0;
    out[i * 2] = (pts[k * 2] ?? w / 2) + (Math.random() - 0.5) * step;
    out[i * 2 + 1] = (pts[k * 2 + 1] ?? h / 2) + (Math.random() - 0.5) * step;
  }
  return out;
}

type Props = {
  heroRef: React.RefObject<HTMLElement>;
  stageRef: React.RefObject<HTMLElement>;
  formed: boolean;
  scroll: MotionValue<number>;
};

const Swarm: React.FC<Props> = ({ heroRef, stageRef, formed, scroll }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const formedRef = useRef(formed);
  formedRef.current = formed;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const narrow = window.innerWidth < 760;
    const COUNT = narrow ? 6000 : 14000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return; // no WebGL: the DOM hero still reads fine on its own
    }
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geo = new THREE.BufferGeometry();
    const from = new Float32Array(COUNT * 2);
    const to = new Float32Array(COUNT * 2);
    const chaos = new Float32Array(COUNT * 2);
    const rand = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      rand[i * 4] = Math.random();
      rand[i * 4 + 1] = Math.random();
      rand[i * 4 + 2] = Math.cos(a);
      rand[i * 4 + 3] = Math.sin(a);
    }
    const aFrom = new THREE.BufferAttribute(from, 2);
    const aTo = new THREE.BufferAttribute(to, 2);
    const aChaos = new THREE.BufferAttribute(chaos, 2);
    geo.setAttribute('aFrom', aFrom);
    geo.setAttribute('aTo', aTo);
    geo.setAttribute('aChaos', aChaos);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    // position is unused by the shader but three needs it to know the vertex count
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));

    const uniforms = {
      uTime: { value: 0 },
      uForm: { value: reduced ? 1 : 0 },
      uMorph: { value: 1 },
      uScatter: { value: 0 },
      uMouseR: { value: narrow ? 64 : 130 },
      uDpr: { value: dpr },
      uSize: { value: narrow ? 1.9 : 2.1 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(-9999, -9999) },
      uCenter: { value: new THREE.Vector2(0, 0) },
      uInk: { value: new THREE.Color('#ecebe6') },
      uOk: { value: new THREE.Color('#c6ff3d') },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    // ── layout ──
    let W = 1, H = 1;
    let region = { x: 0, y: 0, w: 1, h: 1 };
    let shapeIdx = 0;
    let fontsOk = false;

    const target = (shape: Shape) => {
      const pts = sampleShape(shape, region.w, region.h, COUNT, narrow);
      for (let i = 0; i < COUNT; i++) {
        pts[i * 2] += region.x;
        pts[i * 2 + 1] += region.y;
      }
      return pts;
    };

    const layout = () => {
      const hero = heroRef.current, stage = stageRef.current;
      if (!hero || !stage) return;
      const hr = hero.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      W = hr.width; H = hr.height;
      renderer.setSize(W, H, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      uniforms.uRes.value.set(W, H);
      uniforms.uCenter.value.set(W / 2, H * 0.42);
      region = { x: sr.left - hr.left, y: sr.top - hr.top, w: Math.max(40, sr.width), h: Math.max(40, sr.height) };

      for (let i = 0; i < COUNT; i++) {
        // chaos cloud: a wide ellipse over the hero, denser towards the middle
        const a = Math.random() * Math.PI * 2;
        const rr = Math.pow(Math.random(), 1.35);
        chaos[i * 2] = W / 2 + Math.cos(a) * rr * W * 0.48;
        chaos[i * 2 + 1] = H * 0.42 + Math.sin(a) * rr * H * 0.46;
      }
      aChaos.needsUpdate = true;

      if (fontsOk) {
        const pts = target(SEQUENCE[shapeIdx]);
        from.set(pts);
        to.set(pts);
        aFrom.needsUpdate = aTo.needsUpdate = true;
        uniforms.uMorph.value = 1;
      }
    };

    // ── pointer ──
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, last: 0, active: false };
    const onMove = (e: PointerEvent) => {
      const hero = heroRef.current;
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (!mouse.active) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.active = true;
      mouse.last = performance.now();
    };
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });

    // ── timeline ──
    let raf = 0;
    let visible = true;
    let formStart = -1;
    let nextSwitch = Infinity;
    let morphStart = -1;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      uniforms.uTime.value = t;

      // form once the page says so and the shapes exist
      if (formedRef.current && fontsOk && formStart < 0) {
        formStart = now;
        nextSwitch = now + FORM_MS + HOLD_MS[SEQUENCE[shapeIdx]];
      }
      if (formStart >= 0 && !reduced) uniforms.uForm.value = Math.min(1, (now - formStart) / FORM_MS);

      // cycle shapes
      if (!reduced && now > nextSwitch && morphStart < 0) {
        from.set(to);
        aFrom.needsUpdate = true;
        shapeIdx = (shapeIdx + 1) % SEQUENCE.length;
        to.set(target(SEQUENCE[shapeIdx]));
        aTo.needsUpdate = true;
        uniforms.uMorph.value = 0;
        morphStart = now;
      }
      if (morphStart >= 0) {
        uniforms.uMorph.value = Math.min(1, (now - morphStart) / MORPH_MS);
        if (uniforms.uMorph.value >= 1) {
          morphStart = -1;
          nextSwitch = now + HOLD_MS[SEQUENCE[shapeIdx]];
        }
      }

      // cursor, or a slow autopilot lens on touch / idle
      if (!mouse.active || now - mouse.last > 4000) {
        mouse.active = false;
        mouse.tx = W * (0.5 + 0.32 * Math.sin(t * 0.31));
        mouse.ty = region.y + region.h * (0.5 + 0.35 * Math.sin(t * 0.47 + 1));
        if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      }
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      uniforms.uMouse.value.set(mouse.x, mouse.y);

      uniforms.uScatter.value = Math.min(1, Math.max(0, scroll.get() * 1.25));

      renderer.render(scene, camera);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    layout();
    Promise.all([
      document.fonts?.load('600 100px "Inter Tight"'),
      document.fonts?.load('italic 400 100px "Instrument Serif"'),
    ])
      .catch(() => undefined)
      .then(() => {
        fontsOk = true;
        layout();
        if (reduced) { uniforms.uForm.value = 1; renderer.render(scene, camera); }
      });

    const ro = new ResizeObserver(() => { layout(); if (reduced) renderer.render(scene, camera); });
    if (heroRef.current) ro.observe(heroRef.current);

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was && !reduced) start();
    });
    io.observe(host);

    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [heroRef, stageRef, scroll]);

  return <div ref={hostRef} className="hp-swarm" />;
};

export default Swarm;
