import React, { useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Film, 
  Image as ImageIcon,
  GripVertical,
  Type,
  Layout,
  Sliders,
  RotateCcw
} from 'lucide-react';

export default function UploadPanel({ 
  slides, 
  setSlides, 
  onLoadPresets, 
  settings, 
  setSettings 
}) {
  const fileInputRef = useRef(null);

  const handleFilesSelected = (files) => {
    const newSlides = Array.from(files).map((file, idx) => {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');

      return {
        id: `slide-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        sequence: slides.length + idx + 1,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        caption: '',
        type: isVideo ? 'video' : 'image',
        url,
        file,
        fileName: cleanName,
        overlayTheme: 'dark',
        captionPosition: 'bottom-left'
      };
    });

    setSlides((prev) => [...prev, ...newSlides]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const updateSlide = (id, key, value) => {
    setSlides(prev => prev.map(slide => slide.id === id ? { ...slide, [key]: value } : slide));
  };

  const moveSlide = (index, direction) => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Recalculate sequences
    const resequenced = newSlides.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setSlides(resequenced);
  };

  const removeSlide = (id) => {
    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Header do Painel */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            Mídias do Tour ({slides.length})
          </h2>
          <p className="text-xs text-slate-400">Monte a sequência da jornada interativa</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 rounded-lg transition"
            title="Carregar imagens de exemplo para testes"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Exemplos
          </button>
          {slides.length > 0 && (
            <button
              onClick={() => setSlides([])}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              title="Limpar todas as mídias"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Zona de Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-950/40 hover:bg-slate-800/30 rounded-xl p-6 text-center cursor-pointer transition group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 group-hover:bg-sky-500/10 text-slate-400 group-hover:text-sky-400 flex items-center justify-center transition mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Arraste imagens ou vídeos aqui
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Recepção, hall, salas de atendimento, lounge (JPG, PNG, WEBP, MP4)
          </p>
        </div>

        {/* Configurações Gerais do Efeito */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ajustes de Animação
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Intensidade Zoom ("Adentrar")</label>
              <select
                value={settings.zoomScale || 1.18}
                onChange={(e) => setSettings(prev => ({ ...prev, zoomScale: parseFloat(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value={1.08}>Sutil (1.08x)</option>
                <option value={1.18}>Moderado (1.18x)</option>
                <option value={1.30}>Intenso (1.30x)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Velocidade Scroll (Scrub)</label>
              <select
                value={settings.scrubDuration || 1}
                onChange={(e) => setSettings(prev => ({ ...prev, scrubDuration: parseFloat(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value={0.5}>Instantâneo (0.5s)</option>
                <option value={1}>Fluido Padrão (1s)</option>
                <option value={1.8}>Ultra Suave (1.8s)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Slides / Mídias Enviadas */}
        <div className="space-y-3">
          {slides.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Nenhuma mídia adicionada. Envie arquivos acima ou clique em "Exemplos".
            </div>
          ) : (
            slides.map((slide, index) => (
              <div
                key={slide.id}
                className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-3 transition shadow-sm"
              >
                {/* Top Header Card */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[160px]">
                      {slide.fileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSlide(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSlide(index, 'down')}
                      disabled={index === slides.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeSlide(slide.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                      title="Remover mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preview Thumbnail & Data Fields */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Thumbnail */}
                  <div className="col-span-1 relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center">
                    {slide.type === 'video' ? (
                      <video src={slide.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-1 right-1 p-1 bg-slate-950/80 rounded text-[10px] text-slate-300">
                      {slide.type === 'video' ? <Film className="w-3 h-3 text-sky-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                    </span>
                  </div>

                  {/* Campos de texto */}
                  <div className="col-span-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Título do Ambiente (ex: Recepção VIP)"
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    <textarea
                      placeholder="Legenda descritiva ou frase de impacto flutuante..."
                      value={slide.caption}
                      rows={2}
                      onChange={(e) => updateSlide(slide.id, 'caption', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Opções visuais do slide */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <label className="text-slate-400 block mb-1">Estilo do Box</label>
                    <select
                      value={slide.overlayTheme}
                      onChange={(e) => updateSlide(slide.id, 'overlayTheme', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      <option value="dark">Escuro com Brilho</option>
                      <option value="glass">Vidro Fosco (Glassmorphism)</option>
                      <option value="minimal">Minimalista (Sem Fundo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Posição da Legenda</label>
                    <select
                      value={slide.captionPosition}
                      onChange={(e) => updateSlide(slide.id, 'captionPosition', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      <option value="bottom-left">Inferior Esquerda</option>
                      <option value="bottom-right">Inferior Direita</option>
                      <option value="center-left">Centro Esquerda</option>
                      <option value="center">Centralizado</option>
                    </select>
                  </div>
                </div>

                {/* Toggle 360 Foto (apenas para imagens) */}
                {slide.type === 'image' && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!slide.is360}
                        onChange={(e) => updateSlide(slide.id, 'is360', e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                      />
                      <span>Imagem Panorâmica 360°</span>
                    </label>
                    {slide.is360 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Visão 360° Ativa
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
