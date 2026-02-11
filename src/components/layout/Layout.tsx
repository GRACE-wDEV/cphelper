import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Toaster } from 'sonner';
import { useAppStore } from '@/stores';
import Celebration from '@/components/Celebration';
import AchievementToast from '@/components/AchievementToast';
import type { Achievement } from '@/types';

export default function Layout() {
  const { zenMode } = useAppStore();
  const [achievementToShow, setAchievementToShow] = useState<Achievement | null>(null);

  // Watch for newly unlocked achievements
  const achievements = useAppStore((s) => s.gamification.achievements);
  const [lastChecked, setLastChecked] = useState<string[]>([]);

  useEffect(() => {
    const unlocked = achievements.filter((a) => a.unlocked).map((a) => a.id);
    const newOnes = unlocked.filter((id) => !lastChecked.includes(id));
    if (newOnes.length > 0) {
      const newAchievement = achievements.find((a) => a.id === newOnes[0]);
      if (newAchievement && lastChecked.length > 0) {
        setAchievementToShow(newAchievement);
        setTimeout(() => setAchievementToShow(null), 5000);
      }
      setLastChecked(unlocked);
    }
  }, [achievements]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      {!zenMode && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!zenMode && <TopBar />}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#14141e',
            border: '1px solid #2a2a3e',
            color: '#e2e8f0',
            fontSize: '13px',
          },
        }}
        richColors
      />
      <Celebration />
      <AchievementToast
        achievement={achievementToShow}
        onDismiss={() => setAchievementToShow(null)}
      />
    </div>
  );
}
