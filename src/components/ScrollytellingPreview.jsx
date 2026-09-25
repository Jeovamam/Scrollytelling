import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Monitor, Tablet, Smartphone, Eye, Sparkles } from 'lucide-react';
import PanoramaViewer360 from './PanoramaViewer360';

import CanvasSequenceViewer from './CanvasSequenceViewer';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollytellingPreview({ slides, settings }) {
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [slideYaws, setSlideYaws] = useState({});
  const [canvasFrameIndices, setCanvasFrameIndices] = useState({});
  const containerRef = useRef(null);
  const scrollableRef = useRef(null);

  const zoomScale = settings?.zoomScale || 1.18;
  const scrubDuration = settings?.scrubDuration || 1;

  useEffect(() => {
    if (!scrollableRef.current || slides.length === 0) return;

    const ctx = gsap.context(() => {
      const slideElements = gsap.utils.toArray('.preview-slide', scrollableRef.current);
      if (slideElements.length === 0) return;

      ScrollTrigger.getAll().forEach(t => t.kill());

      const totalHeight = slideElements.length * 100;
      const section = scrollableRef.current.querySelector('.preview-section');
      if (section) {
        section.style.height = `${totalHeight}vh`;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          scroller: scrollableRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: scrubDuration,
          anticipatePin: 1
        }
      });

      slideElements.forEach((slide, i) => {
        const media = slide.querySelector('.preview-media:not(canvas)');
        const caption = slide.querySelector('.preview-caption');
        const is360 = slides[i]?.is360;
        const isCanvasSequence = slides[i]?.isCanvasSequence;
        const totalFrames = slides[i]?.sequenceData?.totalFrames || 0;

        // 1. Efeito de Câmera Avançando (Scale 1.0 -> 1.45 ao adentrar)
        if (i === 0) {
          if (media) {
            tl.to(media, { scale: 1.45, ease: 'none' }, 0);
          }
        } else {
          tl.to(slide, {
            autoAlpha: 1,
            duration: 1,
            ease: 'power2.out'
          }, i - 0.35);

          if (media) {
            tl.fromTo(media,
              { scale: 1.35 },
              { scale: 1.0, duration: 1.1, ease: 'power1.out' },
              i - 0.35
            );
          }

          if (i < slideElements.length - 1 && media) {
            tl.to(media, {
              scale: 1.45,
              duration: 1,
              ease: 'none'
            }, i + 0.4);
          }
        }

        // Se for sequência de quadros Canvas (Apple-Style)
        if (isCanvasSequence && totalFrames > 0) {
          const dummyFrameObj = { frame: 0 };
          tl.to(dummyFrameObj, {
            frame: totalFrames - 1,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => {
              const currentIdx = Math.round(dummyFrameObj.frame);
              setCanvasFrameIndices(prev => ({ ...prev, [i]: currentIdx }));
            }
          }, i === 0 ? 0 : i - 0.2);
        }

        // Se for 360°, rotação panorâmica sincronizada com o scroll
        if (is360) {
          const dummyObj = { yaw: 0 };
          tl.to(dummyObj, {
            yaw: 360,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => {
              setSlideYaws(prev => ({ ...prev, [i]: dummyObj.yaw }));
            }
          }, i === 0 ? 0 : i - 0.2);
        }

        if (caption) {
          tl.fromTo(caption,
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out' },
            i === 0 ? 0.1 : i - 0.15
          );

          if (i < slideElements.length - 1) {
            tl.to(caption, {
              opacity: 0,
              y: -30,
              scale: 0.95,
              duration: 0.45,
              ease: 'power2.in'
            }, i + 0.55);
          }
        }
      });
    }, scrollableRef);

    return () => ctx.revert();
  }, [slides, settings, deviceMode]);

  const deviceWidths = {
    desktop: 'w-full max-w-full',
    tablet: 'w-[768px] max-w-full',
    mobile: 'w-[375px] max-w-full'
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden" ref={containerRef}>
      {/* Header do Preview */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Pré-visualização Interativa (Scroll & WebGL 360°)
          </span>
        </div>

        {/* Alternador de Responsividade */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${deviceMode === 'desktop' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${deviceMode === 'tablet' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Tablet className="w-3.5 h-3.5" />
            Tablet
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${deviceMode === 'mobile' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>
      </div>

      {/* Frame de Exibição */}
      <div className="flex-1 bg-slate-950/60 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        <div className={`h-full transition-all duration-300 ${deviceWidths[deviceMode]} bg-black rounded-2xl shadow-2xl border border-slate-800 overflow-hidden relative flex flex-col`}>
          
          {/* Scrollable Container */}
          <div
            ref={scrollableRef}
            className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {/* Header Simulado da Landing Page */}
            <div className="sticky top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-slate-950/70 backdrop-blur border-b border-white/10 pointer-events-none">
              <span className="font-bold text-sm tracking-tight text-white">REALTOR & SPACE</span>
              <span className="text-xs px-3 py-1 bg-sky-500 text-white rounded-full font-semibold">Agendar Visita</span>
            </div>

            {/* Seção Scrollytelling Pinned */}
            {slides.length === 0 ? (
              <div className="h-[600px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                <Sparkles className="w-10 h-10 text-sky-400/40 animate-pulse" />
                <p className="text-sm">Envie imagens/vídeos no painel ao lado para gerar o preview em tempo real.</p>
              </div>
            ) : (
              <>
                <div className="preview-section relative w-full">
                  <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
                    {slides.map((slide, index) => {
                      const posClasses = {
                        'bottom-left': 'bottom-12 left-6 sm:left-10 text-left',
                        'bottom-right': 'bottom-12 right-6 sm:right-10 text-left',
                        'center-left': 'top-1/2 -translate-y-1/2 left-6 sm:left-10 text-left',
                        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center'
                      };

                      const themeClasses = {
                        dark: 'bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-2xl',
                        glass: 'bg-slate-900/60 border border-white/20 backdrop-blur-xl shadow-2xl',
                        minimal: 'bg-transparent border-none shadow-none p-0'
                      };

                      return (
                        <div
                          key={slide.id}
                          className={`preview-slide absolute inset-0 w-full h-full flex items-center justify-center ${index === 0 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                        >
                          {/* Media Container (2D, Video, Canvas Sequence ou WebGL 360°) */}
                          <div className="absolute inset-0 w-full h-full overflow-hidden">
                            {slide.isCanvasSequence ? (
                              <div className="relative w-full h-full bg-slate-950">
                                <CanvasSequenceViewer
                                  frames={slide.sequenceData?.frames || []}
                                  currentFrameIndex={canvasFrameIndices[index] || 0}
                                />
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg pointer-events-none">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Canvas Sequence 60fps (Estilo Apple)</span>
                                </div>
                              </div>
                            ) : slide.is360 ? (
                              <div className="relative w-full h-full bg-slate-950 overflow-hidden">
                                <PanoramaViewer360
                                  url={slide.url}
                                  yaw={slideYaws[index] || 0}
                                  interactive={true}
                                />
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg pointer-events-none">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Visualizador Esférico 360° (Arraste para explorar)</span>
                                </div>
                              </div>
                            ) : slide.type === 'video' ? (
                              <video src={slide.url} autoPlay muted loop playsInline className="preview-media w-full h-full object-cover" />
                            ) : (
                              <img src={slide.url} alt={slide.title} className="preview-media w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80 pointer-events-none" />
                          </div>

                          {/* Caption Box */}
                          {(slide.title || slide.caption) && (
                            <div className={`preview-caption absolute z-10 max-w-md w-[calc(100%-48px)] p-6 rounded-2xl ${posClasses[slide.captionPosition || 'bottom-left']} ${themeClasses[slide.overlayTheme || 'dark']}`}>
                              {slide.title && (
                                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight mb-2">
                                  {slide.title}
                                </h3>
                              )}
                              {slide.caption && (
                                <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mb-3">
                                  {slide.caption}
                                </p>
                              )}
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 uppercase tracking-widest">
                                <span>{String(index + 1).padStart(2, '0')}</span> / {String(slides.length).padStart(2, '0')}
                                {slide.is360 && ' • VISÃO 360°'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Scroll Hint */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20 flex flex-col items-center gap-1.5 opacity-75">
                      <div className="w-5 h-8 border-2 border-white/60 rounded-full relative">
                        <div className="w-1 h-2 bg-white rounded-full absolute top-1.5 left-1/2 -translate-x-1/2 animate-bounce" />
                      </div>
                      <span className="text-[10px] text-white/80 font-medium tracking-wider uppercase">Role para explorar</span>
                    </div>
                  </div>
                </div>

                {/* Seção pós-tour */}
                <div className="bg-slate-900 py-24 px-8 text-center border-t border-slate-800">
                  <h3 className="text-2xl font-bold text-white mb-3">Fim da Experiência Imersiva</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Este é um exemplo de seção seguinte na sua Landing Page. O código exportado integra perfeitamente com seu site.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
