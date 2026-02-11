import { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useProblemStore, useAppStore } from '@/stores';
import { getMonacoLanguage, debounce } from '@/utils';

// Global ref for snippet insertion - allows inserting code at cursor from anywhere
let globalEditorInsert: ((code: string) => void) | null = null;
export function insertSnippetAtCursor(code: string) {
  if (globalEditorInsert) globalEditorInsert(code);
}

export default function CodeEditor() {
  const editorRef = useRef<any>(null);
  const { activeProblemId, activeLanguage, getCode, setCode } = useProblemStore();
  const { settings } = useAppStore();

  const code = activeProblemId ? getCode(activeProblemId, activeLanguage) : '';

  const debouncedSetCode = useCallback(
    debounce((value: string) => {
      if (activeProblemId) {
        setCode(activeProblemId, activeLanguage, value);
      }
    }, 300),
    [activeProblemId, activeLanguage]
  );

  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      debouncedSetCode(value);
    }
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Custom dark theme
    monaco.editor.defineTheme('cphelper-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a4a6a', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'function', foreground: '61afef' },
        { token: 'variable', foreground: 'e06c75' },
        { token: 'operator', foreground: '56b6c2' },
      ],
      colors: {
        'editor.background': '#0d0d14',
        'editor.foreground': '#abb2bf',
        'editorCursor.foreground': '#6366f1',
        'editor.lineHighlightBackground': '#14141e',
        'editor.selectionBackground': '#6366f130',
        'editor.inactiveSelectionBackground': '#6366f115',
        'editorLineNumber.foreground': '#2a2a3e',
        'editorLineNumber.activeForeground': '#6366f1',
        'editorIndentGuide.background': '#1a1a2e',
        'editorIndentGuide.activeBackground': '#2a2a3e',
        'editorGutter.background': '#0d0d14',
        'editorWidget.background': '#14141e',
        'editorWidget.border': '#2a2a3e',
        'editorSuggestWidget.background': '#14141e',
        'editorSuggestWidget.border': '#2a2a3e',
        'editorSuggestWidget.selectedBackground': '#1c1c2e',
        'editorHoverWidget.background': '#14141e',
        'editorHoverWidget.border': '#2a2a3e',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#2a2a3e50',
        'scrollbarSlider.hoverBackground': '#2a2a3e80',
        'scrollbarSlider.activeBackground': '#6366f150',
      },
    });

    monaco.editor.setTheme('cphelper-dark');

    // Keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Auto-save is handled by debounce, but this prevents browser save dialog
    });

    // Focus editor
    editor.focus();

    // Register global insert function for snippet palette
    globalEditorInsert = (code: string) => {
      const selection = editor.getSelection();
      if (selection) {
        editor.executeEdits('snippet-palette', [
          {
            range: selection,
            text: '\n' + code + '\n',
            forceMoveMarkers: true,
          },
        ]);
        editor.focus();
      }
    };
  };

  if (!activeProblemId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm">Select or create a problem to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={getMonacoLanguage(activeLanguage)}
        value={code}
        onChange={handleChange}
        onMount={handleMount}
        theme="cphelper-dark"
        options={{
          fontSize: settings.editorFontSize,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontLigatures: true,
          tabSize: settings.editorTabSize,
          wordWrap: settings.editorWordWrap ? 'on' : 'off',
          minimap: { enabled: settings.editorMinimap },
          lineNumbers: settings.editorLineNumbers ? 'on' : 'off',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 12, bottom: 12 },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: true,
          automaticLayout: true,
          contextmenu: true,
          folding: true,
          foldingStrategy: 'indentation',
        }}
        loading={
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Loading editor...
            </div>
          </div>
        }
      />
    </div>
  );
}
