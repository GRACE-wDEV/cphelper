import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Clock, Bell } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAppStore } from '@/stores';
import { formatTimerDisplay, cn } from '@/utils';

const PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '2.5h', minutes: 150 },
  { label: '3h', minutes: 180 },
];

export default function TimerPage() {
  const { timer, startTimer, pauseTimer, resetTimer, tickTimer } = useAppStore();
  const [customMinutes, setCustomMinutes] = useState('120');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tick the timer
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(tickTimer, 50);
    return () => clearInterval(interval);
  }, [timer.isRunning, tickTimer]);

  // Alert when timer ends
  useEffect(() => {
    if (timer.remainingMs === 0 && timer.startTime !== null) {
      // Use notification API if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('CPHelper Timer', {
          body: 'Time is up! Contest is over.',
          icon: '/icon.svg',
        });
      }
    }
  }, [timer.remainingMs]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const progress =
    timer.startTime !== null
      ? 1 - timer.remainingMs / (timer.duration * 60 * 1000)
      : 0;

  const isWarning = timer.remainingMs > 0 && timer.remainingMs < 300000; // < 5 min
  const isDanger = timer.remainingMs > 0 && timer.remainingMs < 60000; // < 1 min
  const isFinished = timer.startTime !== null && timer.remainingMs === 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-bold text-gray-200 flex items-center justify-center gap-2">
            <TimerIcon className="w-5 h-5 text-accent-light" />
            Contest Timer
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Simulate contest time pressure to improve speed
          </p>
        </div>

        {/* Timer display */}
        <Card className="relative overflow-hidden mb-6">
          {/* Progress bar background */}
          <div className="absolute inset-0 opacity-10">
            <div
              className={cn(
                'h-full transition-all duration-300',
                isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'gradient-bg'
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="relative text-center py-12">
            {/* Timer digits */}
            <motion.div
              key={timer.remainingMs}
              className={cn(
                'text-6xl md:text-7xl font-mono font-bold mb-4 tracking-wider',
                isFinished
                  ? 'text-red-400'
                  : isDanger
                  ? 'text-red-400 animate-pulse'
                  : isWarning
                  ? 'text-yellow-400'
                  : 'gradient-text'
              )}
            >
              {isFinished ? "TIME'S UP!" : formatTimerDisplay(timer.remainingMs)}
            </motion.div>

            {/* Progress ring */}
            <div className="w-4 h-4 rounded-full mx-auto mb-6 relative">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90 mx-auto">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#1a1a2e"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={isDanger ? '#ef4444' : isWarning ? '#eab308' : '#6366f1'}
                  strokeWidth="2"
                  strokeDasharray={`${progress * 100} 100`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {timer.startTime === null ? (
                <Button
                  size="lg"
                  onClick={() => startTimer(parseInt(customMinutes) || 120)}
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  Start Timer
                </Button>
              ) : (
                <>
                  <Button
                    variant={timer.isRunning ? 'secondary' : 'primary'}
                    size="lg"
                    onClick={pauseTimer}
                  >
                    {timer.isRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" fill="currentColor" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button variant="danger" size="lg" onClick={resetTimer}>
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Duration presets */}
        {timer.startTime === null && (
          <Card>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Contest Duration
            </h3>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => setCustomMinutes(String(preset.minutes))}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                    customMinutes === String(preset.minutes)
                      ? 'gradient-bg text-white border-transparent shadow-glow'
                      : 'bg-surface border-surface-border text-gray-400 hover:border-accent/30'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-surface-border text-sm text-gray-200 font-mono"
                  placeholder="Minutes"
                />
              </div>
              <span className="text-xs text-gray-500">minutes</span>
            </div>
          </Card>
        )}

        {/* Tips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-green-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-300">Time Management</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Read all problems first. Solve easy ones quickly, then tackle harder ones.
                </p>
              </div>
            </div>
          </Card>
          <Card className="border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center text-accent-light shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-300">Notifications</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Allow notifications to get alerted when time runs out.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
