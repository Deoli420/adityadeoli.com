import React, { useEffect, useRef } from 'react';

/**
 * A field of short strokes in noisy, drifting orientations — unverified output.
 * Inside the "lens" (the cursor, or a slow autopilot path on touch devices)
 * every stroke snaps level and turns signal-green: verified.
 */
export const TrustField: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0, cols = 0, rows = 0, gap = 26;
    let angles = new Float32Array(0);
    let mix = new Float32Array(0);
    const lens = { x: 0, y: 0, tx: 0, ty: 0, r: 190 };
    let pointerActive = false;
    let lastPointer = 0;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = w < 700 ? 22 : 26;
      lens.r = w < 700 ? 120 : 190;
      cols = Math.ceil(w / gap) + 1;
      rows = Math.ceil(h / gap) + 1;
      angles = new Float32Array(cols * rows);
      mix = new Float32Array(cols * rows);
      if (!lens.x) { lens.x = lens.tx = w * 0.7; lens.y = lens.ty = h * 0.38; }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      lens.tx = e.clientX - rect.left;
      lens.ty = e.clientY - rect.top;
      pointerActive = true;
      lastPointer = performance.now();
    };

    // cheap smooth pseudo-noise
    const field = (x: number, y: number, t: number) =>
      Math.sin(x * 0.011 + t * 0.35) * 1.3 +
      Math.cos(y * 0.013 - t * 0.27) * 1.1 +
      Math.sin((x + y) * 0.006 + t * 0.18) * 0.9;

    const draw = (now: number) => {
      const t = now / 1000;

      // autopilot when there is no pointer (touch, or idle for 4s)
      if (!pointerActive || now - lastPointer > 4000) {
        pointerActive = false;
        lens.tx = w * (0.62 + 0.24 * Math.sin(t * 0.23));
        lens.ty = h * (0.36 + 0.2 * Math.sin(t * 0.37 + 1.2));
      }
      lens.x += (lens.tx - lens.x) * 0.09;
      lens.y += (lens.ty - lens.y) * 0.09;

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      const len = gap * 0.36;
      const r2 = lens.r * lens.r;

      // two passes so the verified strokes draw on top with one style change each
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const k = j * cols + i;
            const x = i * gap, y = j * gap;
            const dx = x - lens.x, dy = y - lens.y;
            const d2 = dx * dx + dy * dy;
            const target = d2 < r2 ? 1 - Math.sqrt(d2) / lens.r : 0;
            if (pass === 0) {
              mix[k] += (Math.min(1, target * 1.8) - mix[k]) * 0.12;
              const noisy = field(x, y, reduced ? 0 : t);
              angles[k] = noisy * (1 - mix[k]);
            }
            const verified = mix[k] > 0.5;
            if ((pass === 0) === verified) continue;
            const a = angles[k];
            const c = Math.cos(a) * len, s = Math.sin(a) * len;
            ctx.moveTo(x - c, y - s);
            ctx.lineTo(x + c, y + s);
          }
        }
        if (pass === 0) {
          ctx.strokeStyle = 'rgba(236,235,230,0.16)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(198,255,61,0.85)';
          ctx.lineWidth = 1.4;
        }
        ctx.stroke();
      }

      // lens ring + label
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(198,255,61,0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '500 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(198,255,61,0.9)';
      ctx.fillText('● VERIFIED', lens.x + lens.r * 0.72, lens.y - lens.r * 0.72);

      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduced) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
};
