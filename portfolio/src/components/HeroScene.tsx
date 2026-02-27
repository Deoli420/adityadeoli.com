/**
 * HeroScene — Three.js 3D background for the Hero section.
 *
 * Two sub-components:
 *   CyberParticles  — floating point cloud (violet/cyan vertex colors)
 *   WireframeShield — spinning icosahedron wireframe with glow shell
 *
 * Performance:
 *   - 600 particles desktop / 300 mobile
 *   - PerformanceMonitor auto-degrades below 30 fps
 *   - Canvas pauses when hero scrolls offscreen (IntersectionObserver)
 *   - prefers-reduced-motion → renders nothing
 *   - Lazy-loaded via React.lazy in Hero.tsx
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

// ── Cyber palette ───────────────────────────────────────────────
const VIOLET = new THREE.Color(0x8e44ec);
const CYAN = new THREE.Color(0x00fff7);

// ── Mouse tracker (shared across sub-components) ─────────────────
function useMouseNDC() {
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { size, viewport } = useThree();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / size.width) * 2 - 1;
      mouse.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [size]);

  return mouse;
}

// ── CyberParticles ───────────────────────────────────────────────
interface ParticleProps {
  count: number;
  degraded: boolean;
}

function CyberParticles({ count, degraded }: ParticleProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const mouse = useMouseNDC();

  const { positions, colors, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread in a sphere of radius ~3
      pos[i3] = (Math.random() - 0.5) * 6;
      pos[i3 + 1] = (Math.random() - 0.5) * 6;
      pos[i3 + 2] = (Math.random() - 0.5) * 4;

      // Mix violet ↔ cyan per particle
      tmpColor.copy(VIOLET).lerp(CYAN, Math.random());
      col[i3] = tmpColor.r;
      col[i3 + 1] = tmpColor.g;
      col[i3 + 2] = tmpColor.b;

      // Gentle upward drift + slight random
      vel[i3] = (Math.random() - 0.5) * 0.002;
      vel[i3 + 1] = 0.001 + Math.random() * 0.002;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return { positions: pos, colors: col, velocities: vel };
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current || degraded) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const mx = mouse.current.x * 3;
    const my = mouse.current.y * 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Apply velocity
      arr[i3] += velocities[i3];
      arr[i3 + 1] += velocities[i3 + 1];
      arr[i3 + 2] += velocities[i3 + 2];

      // Mouse repulsion (XY plane)
      const dx = arr[i3] - mx;
      const dy = arr[i3 + 1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5 && dist > 0.01) {
        const force = (1.5 - dist) * 0.01;
        arr[i3] += (dx / dist) * force;
        arr[i3 + 1] += (dy / dist) * force;
      }

      // Wrap around bounds
      if (arr[i3 + 1] > 3.5) arr[i3 + 1] = -3.5;
      if (arr[i3] > 3.5) arr[i3] = -3.5;
      if (arr[i3] < -3.5) arr[i3] = 3.5;
    }

    posAttr.needsUpdate = true;

    // Slow group rotation
    pointsRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ── WireframeShield ──────────────────────────────────────────────
interface ShieldProps {
  degraded: boolean;
}

function WireframeShield({ degraded }: ShieldProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const mouse = useMouseNDC();

  useFrame(({ clock }) => {
    if (!meshRef.current || degraded) return;
    const t = clock.getElapsedTime();

    // Slow rotation
    meshRef.current.rotation.y += 0.003;
    meshRef.current.rotation.x += 0.001;

    // Breathing scale
    const breathe = 1 + Math.sin(t * 0.5) * 0.03;
    meshRef.current.scale.setScalar(breathe);

    // Mouse-following tilt (subtle)
    const targetRotX = mouse.current.y * 0.3;
    const targetRotZ = -mouse.current.x * 0.2;
    meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.02;
    meshRef.current.rotation.z += (targetRotZ - meshRef.current.rotation.z) * 0.02;

    // Sync glow shell
    if (glowRef.current) {
      glowRef.current.rotation.copy(meshRef.current.rotation);
      glowRef.current.scale.setScalar(breathe * 1.04);
    }
  });

  return (
    <group>
      {/* Main wireframe */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial
          color={VIOLET}
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial
          color={CYAN}
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

// ── Main exported component ──────────────────────────────────────
const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for particle count
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Pause canvas when hero scrolls offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Respect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reducedMotion) return null;

  const particleCount = isMobile ? 300 : 600;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1]"
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        frameloop={visible ? 'always' : 'never'}
        style={{ pointerEvents: 'none' }}
      >
        <PerformanceMonitor
          onDecline={() => setDegraded(true)}
          onIncline={() => setDegraded(false)}
        />
        <CyberParticles count={particleCount} degraded={degraded} />
        <WireframeShield degraded={degraded} />
      </Canvas>
    </div>
  );
};

export default HeroScene;
