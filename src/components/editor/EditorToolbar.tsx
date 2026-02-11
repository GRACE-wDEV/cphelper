import { useProblemStore, useAppStore } from '@/stores';
import { getLanguageLabel, getLanguageIcon, cn } from '@/utils';
import type { Language } from '@/types';
import { Play, RotateCcw, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES: Language[] = ['cpp', 'python', 'java', 'javascript'];

export default function EditorToolbar() {
  const {
    activeLanguage,
    setActiveLanguage,
    activeProblemId,
    isRunning,
    runAllTestCases,
    resetTestCases,
  } = useProblemStore();
  const { templates } = useAppStore();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const handleRunAll = () => {
    if (activeProblemId && !isRunning) {
      runAllTestCases(activeProblemId);
    }
  };

  const handleReset = () => {
    if (activeProblemId) {
      resetTestCases(activeProblemId);
    }
  };

  const handleLoadTemplate = (code: string) => {
    if (activeProblemId) {
      useProblemStore.getState().setCode(activeProblemId, activeLanguage, code);
    }
    setShowTemplateDropdown(false);
  };

  return (
    <div className="h-10 flex items-center justify-between px-3 bg-bg-secondary border-b border-surface-border shrink-0">
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown((s) => !s)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface hover:bg-surface-hover border border-surface-border text-xs font-medium text-gray-300 transition-colors"
          >
            <span>{getLanguageIcon(activeLanguage)}</span>
            <span>{getLanguageLabel(activeLanguage)}</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
          <AnimatePresence>
            {showLangDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[99]"
                  onClick={() => setShowLangDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 mt-1 w-44 bg-surface border border-surface-border rounded-lg shadow-xl overflow-hidden z-[100]"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setActiveLanguage(lang);
                        setShowLangDropdown(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                        lang === activeLanguage
                          ? 'bg-accent-muted text-accent-light'
                          : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'
                      )}
                    >
                      <span>{getLanguageIcon(lang)}</span>
                      <span>{getLanguageLabel(lang)}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Template loader */}
        <div className="relative">
          <button
            onClick={() => setShowTemplateDropdown((s) => !s)}
            className="px-2.5 py-1.5 rounded-md bg-surface hover:bg-surface-hover border border-surface-border text-xs text-gray-400 transition-colors"
          >
            Load Template
          </button>
          <AnimatePresence>
            {showTemplateDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[99]"
                  onClick={() => setShowTemplateDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 mt-1 w-56 bg-surface border border-surface-border rounded-lg shadow-xl overflow-hidden z-[100]"
                >
                  {templates
                    .filter((t) => t.language === activeLanguage)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleLoadTemplate(t.code)}
                        className="w-full flex flex-col items-start px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="text-xs text-gray-300">{t.name}</span>
                        <span className="text-[10px] text-gray-500">{t.description}</span>
                      </button>
                    ))}
                  {templates.filter((t) => t.language === activeLanguage).length === 0 && (
                    <div className="px-3 py-4 text-xs text-gray-500 text-center">
                      No templates for this language
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition-colors"
          disabled={isRunning}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        {/* Run All */}
        <button
          onClick={handleRunAll}
          disabled={!activeProblemId || isRunning}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
            isRunning
              ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
              : 'gradient-bg text-white hover:opacity-90 shadow-glow'
          )}
        >
          {isRunning ? (
            <>
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-3 h-3" fill="currentColor" />
              Run All
              <kbd className="ml-1 px-1 py-0.5 rounded bg-white/10 text-[9px] font-mono">F5</kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
