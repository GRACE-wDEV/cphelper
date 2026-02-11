import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Achievement } from '@/types';
import { cn } from '@/utils';

const RARITY_COLORS = {
  common: { border: 'border-gray-500/30', bg: 'bg-gray-500/10', text: 'text-gray-300', glow: '' },
  rare: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-300', glow: 'shadow-blue-500/20' },
  epic: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
  legendary: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
};

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  if (!achievement) return null;

  const colors = RARITY_COLORS[achievement.rarity];

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            'fixed top-20 right-4 z-[150] w-80 rounded-xl border overflow-hidden cursor-pointer backdrop-blur-sm',
            colors.border,
            colors.bg,
            colors.glow && `shadow-lg ${colors.glow}`
          )}
          onClick={onDismiss}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: 3, duration: 1.5 }}
          />

          <div className="relative p-4 flex items-start gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="text-3xl shrink-0"
            >
              {achievement.icon}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                  Achievement Unlocked!
                </span>
              </div>
              <h4 className={cn('text-sm font-bold', colors.text)}>
                {achievement.title}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {achievement.description}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase',
                  achievement.rarity === 'legendary' && 'bg-yellow-500/20 text-yellow-400',
                  achievement.rarity === 'epic' && 'bg-purple-500/20 text-purple-400',
                  achievement.rarity === 'rare' && 'bg-blue-500/20 text-blue-400',
                  achievement.rarity === 'common' && 'bg-gray-500/20 text-gray-400',
                )}>
                  {achievement.rarity}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
