import React, { useState, useEffect } from 'react';
import { Eye, Code2, Download } from 'lucide-react';
import UploadPanel from './components/UploadPanel';
import ScrollytellingPreview from './components/ScrollytellingPreview';
import CodeViewer from './components/CodeViewer';
import { PRESET_SLIDES } from './data/presets';
import { exportToZip } from './utils/zipExporter';

export default function App() {
  const [slides, setSlides] = useState(PRESET_SLIDES);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code'
  const [settings, setSettings] = useState({
    zoomScale: 1.45,
    scrubDuration: 1,
    title: 'Residencial & Exclusive Real Estate',
    metaDescription: 'Conheça o tour virtual imersivo do empreendimento com alta resolução e experiência interativa em 360° e 60fps.',
    businessName: 'Empresarial & Real Estate',
    ogImage: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleLoadPresets = () => {
    setSlides(PRESET_SLIDES);
  };

  // Memory Leak Cleanup (3.1): Revoke Object URLs on unmount
  useEffect(() => {
    return () => {
      slides.forEach(s => {
        if (s.url?.startsWith('blob:')) URL.revokeObjectURL(s.url);
        if (s.sequenceData?.frames) {
          s.sequenceData.frames.forEach(f => {
            if (f.objectUrl?.startsWith('blob:')) URL.revokeObjectURL(f.objectUrl);
          });
        }
      });
    };
  }, [slides]);

  const handleQuickExport = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      await exportToZip(slides, settings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Scrollytelling Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-md shadow-sky-500/20 border border-slate-700/50"
          />
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Scrollytelling Generator
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Landing Pages
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Crie tours virtuais imersivos com efeito de profundidade ("adentrar") para imóveis e espaços
            </p>
          </div>
        </div>

        {/* Navigation & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Alternador de Modo (Preview / Código) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('preview')}
              aria-label="Alternar para visualização de preview ao vivo"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${viewMode === 'preview' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Ao Vivo
            </button>
            <button
              onClick={() => setViewMode('code')}
              aria-label="Alternar para visualização de código exportável"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${viewMode === 'code' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Ver Código (HTML/CSS/JS)
            </button>
          </div>

          {/* Quick Export ZIP */}
          <button
            onClick={handleQuickExport}
            disabled={slides.length === 0 || isExporting}
            aria-label="Exportar pacote completo ZIP"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition shadow-lg shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exportando...' : 'Exportar .ZIP'}
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel Esquerdo: Drag-and-Drop & Mídias */}
        <div className="w-80 sm:w-96 shrink-0 h-full">
          <UploadPanel
            slides={slides}
            setSlides={setSlides}
            onLoadPresets={handleLoadPresets}
            settings={settings}
            setSettings={setSettings}
          />
        </div>

        {/* Área Direita: Visualizador (Preview ou Código) */}
        <div className="flex-1 h-full overflow-hidden bg-slate-950">
          {viewMode === 'preview' ? (
            <ScrollytellingPreview slides={slides} settings={settings} />
          ) : (
            <CodeViewer slides={slides} settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
}
