import React, { useEffect, useRef } from 'react';

interface Bug {
  id: string;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  element: HTMLDivElement;
  startTime: number;
}

const BUG_EMOJIS = ['🐞', '🐜', '🐛', '🕷️', '🪲', '🦗', '🪰', '🐝'];
const ANIMATION_DURATION = 1400; // ms
const MAX_BUGS = 50; // Performance cap

export const MagicalBugSwarm: React.FC = () => {
  const bugsRef = useRef<Bug[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const isInteractiveElement = (element: Element): boolean => {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'];
    const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'listbox'];
    
    // Check if element or any parent is interactive
    let current: Element | null = element;
    while (current) {
      if (
        interactiveTags.includes(current.tagName) ||
        current.hasAttribute('onclick') ||
        current.hasAttribute('role') && interactiveRoles.includes(current.getAttribute('role') || '') ||
        current.classList.contains('cursor-pointer') ||
        current.classList.contains('cursor-[emoji]') ||
        getComputedStyle(current).cursor === 'pointer' ||
        // Prevent interference with game area
        current.id === 'airdrop-game' ||
        current.closest('#airdrop-game') ||
        current.closest('[data-game-area]') ||
        // Check for isolation stacking context (game area uses this)
        getComputedStyle(current).isolation === 'isolate'
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };

  const createBug = (centerX: number, centerY: number, index: number, totalBugs: number): Bug => {
    // Create perfect radial distribution
    const baseAngle = (index / totalBugs) * Math.PI * 2;
    // Add some randomness to the angle for natural feel
    const angleVariation = (Math.random() - 0.5) * 0.8;
    const angle = baseAngle + angleVariation;
    
    // Vary the initial distance from center (small radius spread)
    const initialRadius = 15 + Math.random() * 25; // 15-40px radius
    const startX = centerX + Math.cos(angle) * initialRadius;
    const startY = centerY + Math.sin(angle) * initialRadius;
    
    // Speed varies for more natural scatter
    const speed = 4 + Math.random() * 6; // 4-10 speed
    const emoji = BUG_EMOJIS[Math.floor(Math.random() * BUG_EMOJIS.length)];
    
    const element = document.createElement('div');
    element.className = 'fixed pointer-events-none select-none';
    element.style.cssText = `
      left: ${startX}px;
      top: ${startY}px;
      font-size: ${14 + Math.random() * 8}px;
      transform-origin: center;
      z-index: 9998;
      filter: 
        drop-shadow(0 0 6px #00fff7) 
        drop-shadow(0 0 12px #8e44ec) 
        drop-shadow(0 0 3px #ff2a6d)
        hue-rotate(${Math.random() * 60 - 30}deg);
      animation: bugSpawn 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    element.textContent = emoji;
    
    if (containerRef.current) {
      containerRef.current.appendChild(element);
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      scale: 1,
      opacity: 1,
      element,
      startTime: Date.now()
    };
  };

  const updateBug = (bug: Bug, deltaTime: number) => {
    const progress = deltaTime / ANIMATION_DURATION;
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Physics with natural movement
    bug.x += bug.vx * (1 - progress * 0.2); // Gradual slowdown
    bug.y += bug.vy * (1 - progress * 0.2);
    bug.vy += 0.12; // Subtle gravity
    bug.vx *= 0.998; // Very light air resistance
    bug.vy *= 0.998;
    bug.rotation += bug.rotationSpeed * (1 - progress * 0.5);
    
    // Magical fade and scale
    bug.scale = Math.max(0.1, 1 - easeOut * 0.8);
    bug.opacity = Math.max(0, 1 - Math.pow(progress, 1.2));
    
    // Glitch effect near end
    const glitchOffset = progress > 0.7 ? (Math.random() - 0.5) * 3 : 0;
    
    // Apply transforms
    bug.element.style.transform = `
      translate(-50%, -50%) 
      translate(${bug.x + glitchOffset}px, ${bug.y + glitchOffset}px) 
      scale(${bug.scale}) 
      rotate(${bug.rotation}deg)
    `;
    bug.element.style.opacity = bug.opacity.toString();
    
    // Enhanced effects as they fade
    if (progress > 0.5) {
      const aberration = (progress - 0.5) * 3;
      const pulse = Math.sin(deltaTime * 0.015) * 0.3;
      bug.element.style.filter = `
        drop-shadow(0 0 6px #00fff7) 
        drop-shadow(0 0 12px #8e44ec) 
        drop-shadow(${aberration}px 0 #ff2a6d)
        drop-shadow(-${aberration}px 0 #00fff7)
        hue-rotate(${Math.sin(deltaTime * 0.008) * 120}deg)
        brightness(${1 + pulse})
        saturate(${1.5 + pulse})
      `;
    }
    
    return progress < 1;
  };

  const animate = () => {
    const now = Date.now();
    
    bugsRef.current = bugsRef.current.filter(bug => {
      const deltaTime = now - bug.startTime;
      const shouldKeep = updateBug(bug, deltaTime);
      
      if (!shouldKeep) {
        bug.element.remove();
      }
      
      return shouldKeep;
    });
    
    if (bugsRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  const handleClick = (event: MouseEvent) => {
    const target = event.target as Element;
    
    if (isInteractiveElement(target)) {
      return;
    }
    
    // Clean up old bugs if we're at the limit
    if (bugsRef.current.length > MAX_BUGS - 12) {
      const oldBugs = bugsRef.current.splice(0, 10);
      oldBugs.forEach(bug => bug.element.remove());
    }
    
    // Determine bug count (fewer on mobile)
    const isMobile = window.innerWidth < 768;
    const bugCount = isMobile ? 
      Math.floor(Math.random() * 3) + 6 : // 6-8 on mobile
      Math.floor(Math.random() * 5) + 10; // 10-14 on desktop
    
    // Create bugs with perfect radial distribution and staggered timing
    for (let i = 0; i < bugCount; i++) {
      setTimeout(() => {
        const bug = createBug(event.clientX, event.clientY, i, bugCount);
        bugsRef.current.push(bug);
        
        // Start animation if not already running
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }, i * 25 + Math.random() * 40); // Stagger with randomness
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clean up any remaining bugs
      bugsRef.current.forEach(bug => bug.element.remove());
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[9998]" />
      <style jsx>{`
        @keyframes bugSpawn {
          0% {
            transform: scale(0) rotate(0deg);
            filter: brightness(3) drop-shadow(0 0 20px #00fff7);
          }
          50% {
            transform: scale(1.4) rotate(180deg);
            filter: brightness(2.5) drop-shadow(0 0 15px #8e44ec);
          }
          100% {
            transform: scale(1) rotate(360deg);
            filter: brightness(1) drop-shadow(0 0 6px #00fff7);
          }
        }
      `}</style>
    </>
  );
};