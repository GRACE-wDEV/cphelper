import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: 'circle' | 'square' | 'star' | 'triangle';
  delay: number;
}

const COLORS = [
  '#22c55e', '#4ade80', '#86efac', // greens
  '#6366f1', '#818cf8', '#a5b4fc', // indigos
  '#22d3ee', '#67e8f9', '#a5f3fc', // cyans
  '#f97316', '#facc15', '#fbbf24', // warm
  '#c084fc', '#e879f9', '#f0abfc', // purples
];

const SHAPES: Particle['shape'][] = ['circle', 'square', 'star', 'triangle'];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20, // center-ish
    y: 30 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 100,
    velocityY: -30 - Math.random() * 60,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    delay: Math.random() * 0.5,
  }));
}

export default function Celebration() {
  const { showCelebration, dismissCelebration, gamification } = useAppStore();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [xpPopups, setXpPopups] = useState<{ id: number; xp: number; label: string; x: number }[]>([]);

  const recentXP = gamification.recentXP.slice(0, 3);

  useEffect(() => {
    if (showCelebration) {
      setParticles(createParticles(80));
      // Show recent XP gains as floating popups
      setXpPopups(
        recentXP.map((e, i) => ({
          id: i,
          xp: e.xp,
          label: e.label,
          x: 35 + Math.random() * 30,
        }))
      );
    } else {
      setParticles([]);
      setXpPopups([]);
    }
  }, [showCelebration]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
        >
          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: 1,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                left: `${p.x + p.velocityX}%`,
                top: `${p.y + 120}%`,
                opacity: [1, 1, 0],
                scale: [0, 1.2, 0.8],
                rotate: p.rotation + 720,
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: p.delay,
              }}
              className="absolute"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
                borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
                clipPath:
                  p.shape === 'triangle'
                    ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                    : p.shape === 'star'
                    ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                    : undefined,
                ...(p.shape === 'star' || p.shape === 'triangle'
                  ? { backgroundColor: p.color }
                  : {}),
              }}
            />
          ))}

          {/* Main celebration text */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            onClick={dismissCelebration}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{ repeat: 2, duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black gradient-text-success mb-2"
              >
                ALL ACCEPTED!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-sm"
              >
                Every test case passed. You're crushing it! 🔥
              </motion.p>

              {/* XP Popups */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-3 mt-4"
              >
                {xpPopups.map((popup, i) => (
                  <motion.div
                    key={popup.id}
                    initial={{ y: 20, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.15 }}
                    className="px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30"
                  >
                    <span className="text-yellow-400 font-bold text-sm">+{popup.xp} XP</span>
                    <span className="text-gray-400 text-xs ml-1.5">{popup.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-gray-600 text-xs mt-5"
              >
                Click anywhere to dismiss
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Glow ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 3], opacity: [0.6, 0.3, 0] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
