import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Code2, FileCode, FileText, Loader2 } from 'lucide-react';
import {
  generateHTML, generateCSS, generateJS,
  generateEmbedHTML, generateEmbedCSS, generateEmbedJS
} from '../utils/codeGenerator';
import { exportToZip } from '../utils/zipExporter';

export default function CodeViewer({ slides, settings }) {
  const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'js'
  const [mode, setMode] = useState('page'); // 'page' | 'embed'
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Memoize generated code to prevent heavy string processing on unrelated re-renders
  const isEmbed = mode === 'embed';
  const htmlCode = useMemo(
    () => (isEmbed ? generateEmbedHTML(slides, settings) : generateHTML(slides, settings)),
    [isEmbed, slides, settings]
  );
  const cssCode = useMemo(
    () => (isEmbed ? generateEmbedCSS(settings) : generateCSS(settings)),
    [isEmbed, settings]
  );
  const jsCode = useMemo(
    () => (isEmbed ? generateEmbedJS(slides, settings) : generateJS(slides, settings)),
    [isEmbed, slides, settings]
  );
  const fileNames = isEmbed
    ? { html: 'embed.html', css: 'scrolly-embed.css', js: 'scrolly-embed.js' }
    : { html: 'index.html', css: 'styles.css', js: 'script.js (GSAP)' };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'html': return htmlCode;
      case 'css': return cssCode;
      case 'js': return jsCode;
      default: return '';
    }
  };

  const handleCopy = () => {
    const code = getActiveCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportZip = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      await exportToZip(slides, settings, (status) => setExportProgress(status));
    } catch (err) {
      console.error('Erro ao exportar ZIP:', err);
      window.alert('Não foi possível exportar o pacote .zip. Verifique as mídias e tente novamente.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header com Abas e Ações */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between z-10 flex-wrap gap-2">
        {/* Modo de exportação */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[['page', 'Página completa'], ['embed', 'Módulo embutível']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${mode === id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('html')}
            aria-label="Ver código HTML semântico"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'html' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileCode className="w-3.5 h-3.5" />
            {fileNames.html}
          </button>
          <button
            onClick={() => setActiveTab('css')}
            aria-label="Ver estilos CSS responsivos"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'css' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            {fileNames.css}
          </button>
          <button
            onClick={() => setActiveTab('js')}
            aria-label="Ver código JavaScript com GSAP"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'js' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {fileNames.js}
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            aria-label="Copiar código para a área de transferência"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
            title="Copiar código da aba selecionada"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Bloco'}
          </button>

          <button
            onClick={handleExportZip}
            disabled={slides.length === 0 || isExporting}
            aria-label="Baixar pacote completo compactado em ZIP"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-lg transition shadow-lg shadow-sky-500/20"
            title="Baixar pacote completo com arquivos HTML, CSS, JS e pastas de imagens"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {exportProgress || 'Exportando...'}
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Baixar Pacote (.ZIP)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Exibição do Código */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 font-['JetBrains_Mono',monospace] text-xs leading-relaxed text-slate-300">
        <pre className="whitespace-pre-wrap break-all">
          <code>{getActiveCode()}</code>
        </pre>
      </div>
    </div>
  );
}
