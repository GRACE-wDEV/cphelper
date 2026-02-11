import { motion } from 'framer-motion';
import { useAppStore } from '@/stores';
import { RANKS, XP_PER_LEVEL } from '@/types';
import { cn } from '@/utils';

export default function XPBar({ collapsed }: { collapsed?: boolean }) {
  const { gamification } = useAppStore();
  const { level, xp, xpToNextLevel, totalXpEarned, rank } = gamification;

  const currentLevelXP = XP_PER_LEVEL + level * 100;
  const progressInLevel = currentLevelXP - xpToNextLevel;
  const progressPercent = Math.min((progressInLevel / currentLevelXP) * 100, 100);

  const rankColor = RANKS.find((r) => r.name === rank)?.color || '#808080';

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-2 py-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border"
          style={{ borderColor: rankColor, color: rankColor, backgroundColor: `${rankColor}15` }}
        >
          {level}
        </div>
        <div className="w-6 h-1 rounded-full bg-surface-border overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: rankColor }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border"
            style={{ borderColor: rankColor, color: rankColor, backgroundColor: `${rankColor}15` }}
          >
            {level}
          </div>
          <div>
            <div className="text-xs font-bold" style={{ color: rankColor }}>
              {rank}
            </div>
            <div className="text-[10px] text-gray-500">
              {totalXpEarned.toLocaleString()} total XP
            </div>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 text-right">
          {Math.round(progressInLevel)}/{currentLevelXP}
        </div>
      </div>

      {/* XP bar */}
      <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: rankColor }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
