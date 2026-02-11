import { useAppStore } from '@/stores';
import { Button, Card, Input } from '@/components/ui';
import { Settings, Monitor, Code2, Keyboard, RotateCcw, Palette } from 'lucide-react';
import { cn, getLanguageLabel } from '@/utils';
import type { Language } from '@/types';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useAppStore();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Settings
            </h1>
            <p className="text-xs text-gray-500 mt-1">Customize your CPHelper experience</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => {
            if (confirm('Reset all settings to defaults?')) resetSettings();
          }}>
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>

        <div className="space-y-4">
          {/* Editor Settings */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
              <Code2 className="w-4 h-4 text-accent-light" />
              Editor
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={settings.editorFontSize}
                    onChange={(e) => updateSettings({ editorFontSize: +e.target.value })}
                    className="w-full accent-accent"
                  />
                  <span className="text-[10px] text-gray-500">{settings.editorFontSize}px</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Tab Size</label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="2"
                    value={settings.editorTabSize}
                    onChange={(e) => updateSettings({ editorTabSize: +e.target.value })}
                    className="w-full accent-accent"
                  />
                  <span className="text-[10px] text-gray-500">{settings.editorTabSize} spaces</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ToggleSetting
                  label="Word Wrap"
                  value={settings.editorWordWrap}
                  onChange={(v) => updateSettings({ editorWordWrap: v })}
                />
                <ToggleSetting
                  label="Minimap"
                  value={settings.editorMinimap}
                  onChange={(v) => updateSettings({ editorMinimap: v })}
                />
                <ToggleSetting
                  label="Line Numbers"
                  value={settings.editorLineNumbers}
                  onChange={(v) => updateSettings({ editorLineNumbers: v })}
                />
                <ToggleSetting
                  label="Auto Save"
                  value={settings.autoSave}
                  onChange={(v) => updateSettings({ autoSave: v })}
                />
              </div>
            </div>
          </Card>

          {/* General Settings */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-accent-light" />
              General
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Default Language</label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => updateSettings({ defaultLanguage: e.target.value as Language })}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
                  >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Compile Timeout (sec)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.compileTimeout}
                    onChange={(e) => updateSettings({ compileTimeout: +e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
                  />
                </div>
              </div>

              <ToggleSetting
                label="Animations"
                description="Enable smooth transitions and animations"
                value={settings.showAnimations}
                onChange={(v) => updateSettings({ showAnimations: v })}
              />
            </div>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
              <Keyboard className="w-4 h-4 text-accent-light" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              <ShortcutRow keys="F5" description="Run all test cases" />
              <ShortcutRow keys="Ctrl+K" description="Quick search" />
              <ShortcutRow keys="Ctrl+N" description="New problem" />
              <ShortcutRow keys="Ctrl+S" description="Save code" />
              <ShortcutRow keys="Ctrl+`" description="Focus terminal" />
            </div>
          </Card>

          {/* About */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-accent-light" />
              About
            </h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong className="text-gray-400">CPHelper</strong> v1.0.0</p>
              <p>A professional competitive programming assistant</p>
              <p>Built with React, TypeScript, Tailwind CSS, Monaco Editor</p>
              <p>Code execution powered by <a href="https://piston.readthedocs.io/" target="_blank" rel="noopener" className="text-accent-light hover:underline">Piston API</a> (free, no API key needed)</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-xs font-medium text-gray-300">{label}</span>
        {description && (
          <p className="text-[10px] text-gray-500">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'w-10 h-5 rounded-full transition-colors relative',
          value ? 'bg-accent' : 'bg-surface-border'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all',
            value ? 'left-5' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

function ShortcutRow({
  keys,
  description,
}: {
  keys: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-400">{description}</span>
      <kbd className="px-2 py-1 rounded bg-bg-primary border border-surface-border text-[10px] text-gray-300 font-mono">
        {keys}
      </kbd>
    </div>
  );
}
