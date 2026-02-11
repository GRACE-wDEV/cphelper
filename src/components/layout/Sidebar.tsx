import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  LayoutDashboard,
  Trophy,
  FileCode2,
  Settings,
  Timer,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  User,
  Sparkles,
  Swords,
  PlayCircle,
  Code,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAppStore } from '@/stores';
import XPBar from '@/components/XPBar';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: '1' },
  { path: '/solve', icon: Code2, label: 'Solve', shortcut: '2' },
  { path: '/problems', icon: Search, label: 'Problems', shortcut: '3' },
  { path: '/contests', icon: Trophy, label: 'Contests', shortcut: '4' },
  { path: '/templates', icon: FileCode2, label: 'Templates', shortcut: '5' },
  { path: '/snippets', icon: BookOpen, label: 'Snippets', shortcut: '6' },
  { path: '/profile', icon: User, label: 'Profile', shortcut: '7' },
  { path: '/recommend', icon: Sparkles, label: 'Recommend', shortcut: '8' },
  { path: '/rivals', icon: Swords, label: 'Rivals', shortcut: '9' },
  { path: '/virtual-contest', icon: PlayCircle, label: 'Virtual', shortcut: 'v' },
  { path: '/settings', icon: Settings, label: 'Settings', shortcut: '0' },
];

export default function Sidebar() {
  const location = useLocation();
  const { settings, updateSettings } = useAppStore();
  const collapsed = settings.sidebarCollapsed;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full flex flex-col bg-bg-secondary border-r border-surface-border relative z-50"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-surface-border shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <Code className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="font-bold text-sm gradient-text">CPHelper</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-accent-muted text-accent-light'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full gradient-bg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] shrink-0 transition-colors',
                  isActive ? 'text-accent-light' : 'group-hover:text-gray-300'
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-light border border-surface-border rounded-md text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* XP Progress */}
      <div className="border-t border-surface-border">
        <XPBar collapsed={collapsed} />
      </div>

      {/* Timer widget */}
      <div className="px-2 pb-2">
        <NavLink
          to="/timer"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            location.pathname === '/timer'
              ? 'bg-accent-muted text-accent-light'
              : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
          )}
        >
          <Timer className="w-[18px] h-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Timer
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-accent transition-all z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
