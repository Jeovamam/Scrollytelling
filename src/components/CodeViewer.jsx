import React, { useState } from 'react';
import { Copy, Check, Download, Code2, FileCode, FileText, Loader2 } from 'lucide-react';
import { generateHTML, generateCSS, generateJS } from '../utils/codeGenerator';
import { exportToZip } from '../utils/zipExporter';

export default function CodeViewer({ slides, settings }) {
  const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'js'
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  const htmlCode = generateHTML(slides, settings);
  const cssCode = generateCSS(settings);
  const jsCode = generateJS(slides, settings);

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
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header com Abas e Ações */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between z-10 flex-wrap gap-2">
        {/* Abas */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'html' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileCode className="w-3.5 h-3.5" />
            index.html
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'css' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            styles.css
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'js' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            script.js (GSAP)
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
            title="Copiar código da aba selecionada"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Bloco'}
          </button>

          <button
            onClick={handleExportZip}
            disabled={slides.length === 0 || isExporting}
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
