import React, { useState } from 'react';
import {
  FileText,
  QrCode,
  Monitor,
  Receipt,
  Image as ImageIcon,
  Search,
  ArrowUpRight,
  ShieldCheck,
  WifiOff,
  Github,
  Copy,
  Check,
} from 'lucide-react';
import { Lang, ToolId, TRANSLATIONS } from '../i18n/translations';
import { AUTHOR_CONFIG } from '../config/author';

interface Props {
  lang: Lang;
  onSelectTool: (id: ToolId) => void;
}

export const CommandOverview: React.FC<Props> = ({ lang, onSelectTool }) => {
  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';
  const [query, setQuery] = useState('');
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const cards: Array<{
    id: Exclude<ToolId, 'overview'>;
    icon: React.ReactNode;
    keywords: string;
    accentClass: string;
  }> = [
    {
      id: 'pdf',
      icon: <FileText className="w-5 h-5" />,
      keywords: 'pdf merge split sign signature rotate watermark convert acrobat ilovepdf smallpdf gabung pisah tanda tangan',
      accentClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'qr',
      icon: <QrCode className="w-5 h-5" />,
      keywords: 'qr code barcode wifi whatsapp vcard svg logo static permanent',
      accentClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'screenshot',
      icon: <Monitor className="w-5 h-5" />,
      keywords: 'screenshot mockup beautifier macos browser frame gradient retina xnapper shots',
      accentClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'invoice',
      icon: <Receipt className="w-5 h-5" />,
      keywords: 'invoice receipt kwitansi nota pdf billing freelance currency idr usd tax',
      accentClass: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    },
    {
      id: 'image',
      icon: <ImageIcon className="w-5 h-5" />,
      keywords: 'image compress convert webp png jpg exif metadata gps privacy tinypng batch zip kompres foto',
      accentClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
  ];

  const filtered = cards.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const meta = t.toolCards[c.id];
    return (
      meta.title.toLowerCase().includes(q) ||
      meta.desc.toLowerCase().includes(q) ||
      c.keywords.includes(q)
    );
  });

  const copyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(AUTHOR_CONFIG.discordUsername);
      setCopiedDiscord(true);
      setTimeout(() => setCopiedDiscord(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-7">
      {/* Compact Studio Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {t.hero.eyebrow}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            {t.hero.title}
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {isId ? '0 Byte Dikirim ke Server' : '0 Bytes Sent to Any Server'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-medium">
              <WifiOff className="w-3.5 h-3.5 text-emerald-500" />
              {isId ? 'Jalan Tanpa Internet' : 'Works Offline After Load'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
              {t.savedPerMonth}
            </span>
          </div>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Tool Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((card) => {
          const info = t.toolCards[card.id];
          return (
            <button
              key={card.id}
              onClick={() => onSelectTool(card.id)}
              className="group text-left p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/70 transition flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.accentClass}`}
                  >
                    {card.icon}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="line-through text-zinc-400">{info.usualPrice}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                      $0
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition flex items-center justify-between gap-2">
                    <span>{info.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {info.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>{info.replaces}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Open-Source Maintainer & Community Strip */}
      <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Open-Source Project · {AUTHOR_CONFIG.license} License
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t.hero.createdBy}{' '}
            <a
              href={AUTHOR_CONFIG.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {AUTHOR_CONFIG.authorName} (@{AUTHOR_CONFIG.githubUsername})
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={copyDiscord}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono hover:border-emerald-500/60 transition cursor-pointer"
            title="Copy Discord Username"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Discord: {AUTHOR_CONFIG.discordUsername}</span>
            {copiedDiscord ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          <a
            href={AUTHOR_CONFIG.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition"
          >
            <Github className="w-3.5 h-3.5" />
            {t.hero.openGithub}
          </a>
        </div>
      </div>
    </div>
  );
};
