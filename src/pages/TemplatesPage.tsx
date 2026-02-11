import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Copy, Check, FileCode2 } from 'lucide-react';
import { Card, Button, Modal, Input, Badge } from '@/components/ui';
import { useAppStore } from '@/stores';
import { cn, getLanguageLabel, getLanguageIcon } from '@/utils';
import type { Language } from '@/types';

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filterLang, setFilterLang] = useState<Language | 'all'>('all');

  const filtered =
    filterLang === 'all'
      ? templates
      : templates.filter((t) => t.language === filterLang);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-accent-light" />
              Code Templates
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Save and manage your competitive programming templates
            </p>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3 h-3" /> New Template
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit mb-6">
          {(['all', 'cpp', 'python', 'java', 'javascript'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setFilterLang(lang)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                filterLang === lang
                  ? 'gradient-bg text-white'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {lang === 'all' ? 'All' : getLanguageLabel(lang)}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">
                        {template.name}
                      </span>
                      {template.isDefault && <Badge variant="accent">Default</Badge>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{template.description}</p>
                  </div>
                  <Badge>
                    {getLanguageIcon(template.language)} {getLanguageLabel(template.language)}
                  </Badge>
                </div>

                {/* Code preview */}
                <pre className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-surface-border text-[11px] text-gray-400 font-mono overflow-hidden max-h-32 mb-3">
                  {template.code.slice(0, 300)}
                  {template.code.length > 300 && '...'}
                </pre>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(template.code, template.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition-colors"
                  >
                    {copied === template.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* New Template Modal */}
        <NewTemplateModal isOpen={showNew} onClose={() => setShowNew(false)} />
      </div>
    </div>
  );
}

function NewTemplateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addTemplate } = useAppStore();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('cpp');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) return;
    addTemplate({
      name: name.trim(),
      language,
      description: description.trim(),
      code,
      isDefault: false,
    });
    setName('');
    setDescription('');
    setCode('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Template" maxWidth="max-w-xl">
      <div className="space-y-4">
        <Input
          label="Template Name"
          placeholder="e.g., Segment Tree Template"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          <Input
            label="Description"
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-400">Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your template code here..."
            rows={12}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-surface-border text-xs text-gray-300 font-mono resize-y placeholder-gray-600"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !code.trim()}>
            Save Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
