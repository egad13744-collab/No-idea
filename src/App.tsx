import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  FileText,
  QrCode,
  Monitor,
  Receipt,
  Image as ImageIcon,
  Sun,
  Moon,
  Github,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { Lang, ToolId, TRANSLATIONS } from './i18n/translations';
import { AUTHOR_CONFIG } from './config/author';
import { CommandOverview } from './components/CommandOverview';
import { PdfStudio } from './components/tools/PdfStudio';
import { QrStudio } from './components/tools/QrStudio';
import { ScreenshotStudio } from './components/tools/ScreenshotStudio';
import { InvoiceStudio } from './components/tools/InvoiceStudio';
import { ImageBatchStudio } from './components/tools/ImageBatchStudio';

export const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolId>('overview');
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('no_idea_lang');
    if (saved === 'en' || saved === 'id') return saved;
    return navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en';
  });
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('no_idea_theme');
    return saved ? saved === 'dark' : true;
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('no_idea_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('no_idea_lang', lang);
  }, [lang]);

  const t = TRANSLATIONS[lang];

  const navItems: Array<{ id: ToolId; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: t.nav.overview, icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'pdf', label: t.nav.pdf, icon: <FileText className="w-4 h-4" />, badge: '4-in-1' },
    { id: 'qr', label: t.nav.qr, icon: <QrCode className="w-4 h-4" />, badge: 'SVG' },
    { id: 'screenshot', label: t.nav.screenshot, icon: <Monitor className="w-4 h-4" />, badge: '2x' },
    { id: 'invoice', label: t.nav.invoice, icon: <Receipt className="w-4 h-4" />, badge: 'PDF' },
    { id: 'image', label: t.nav.image, icon: <ImageIcon className="w-4 h-4" />, badge: 'ZIP' },
  ];

  const selectTool = (id: ToolId) => {
    setActiveTool(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 z-30">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/80">
          <button
            onClick={() => selectTool('overview')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-zinc-950 font-black font-mono text-base flex items-center justify-center shadow-xs">
              N
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                <span>{AUTHOR_CONFIG.projectName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  OSS
                </span>
              </div>
              <div className="text-[11px] text-zinc-500">{t.brandSubtitle}</div>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeTool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectTool(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{t.privacyBadge}</span>
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>By {AUTHOR_CONFIG.authorName}</span>
            <span className="font-mono">{AUTHOR_CONFIG.discordUsername}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 px-4 sm:px-8 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => selectTool('overview')}
              className="lg:hidden font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="w-6 h-6 rounded-md bg-emerald-500 text-zinc-950 font-mono text-xs font-black flex items-center justify-center">
                N
              </span>
              <span>{AUTHOR_CONFIG.projectName}</span>
            </button>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {t.privacyBadge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setLang('id')}
                className={`px-2 py-1 rounded-md cursor-pointer transition ${
                  lang === 'id'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                    : 'text-zinc-500'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md cursor-pointer transition ${
                  lang === 'en'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                    : 'text-zinc-500'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 transition cursor-pointer"
              title="Toggle Theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href={AUTHOR_CONFIG.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 transition"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => selectTool(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                  activeTool === item.id
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active Workspace */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {activeTool === 'overview' && (
            <CommandOverview lang={lang} onSelectTool={selectTool} />
          )}
          {activeTool === 'pdf' && <PdfStudio lang={lang} />}
          {activeTool === 'qr' && <QrStudio lang={lang} />}
          {activeTool === 'screenshot' && <ScreenshotStudio lang={lang} />}
          {activeTool === 'invoice' && <InvoiceStudio lang={lang} />}
          {activeTool === 'image' && <ImageBatchStudio lang={lang} />}
        </main>
      </div>
    </div>
  );
};

export default App;
