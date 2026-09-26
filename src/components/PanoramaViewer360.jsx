import React, { useRef, useEffect, useState } from 'react';
import { createPanoramaViewer, isWebGLSupported } from '../utils/panoramaEngine';
import { AlertCircle } from 'lucide-react';

export default function PanoramaViewer360({ url, yaw = 0, pitch = 0, interactive = true, className = '' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isSupported] = useState(() => isWebGLSupported());
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    if (!containerRef.current || !url) return;

    try {
      const viewer = createPanoramaViewer(containerRef.current, url, { yaw, pitch, interactive });
      viewerRef.current = viewer;
    } catch (err) {
      console.warn('Falha ao inicializar WebGL 360°:', err);
      queueMicrotask(() => setInitError(true));
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [url, interactive, pitch, yaw, isSupported]);

  useEffect(() => {
    if (viewerRef.current && typeof viewerRef.current.updateYaw === 'function') {
      viewerRef.current.updateYaw(yaw);
    }
  }, [yaw]);

  if (!isSupported || initError) {
    return (
      <div className={`w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 ${className}`}>
        <AlertCircle className="w-8 h-8 text-amber-400" />
        <p className="text-xs font-semibold text-slate-300">Visualização 360° Indisponível</p>
        <p className="text-[11px] text-slate-500 max-w-xs">Seu navegador ou dispositivo não possui suporte a aceleração gráfica WebGL 3D.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative cursor-crosshair ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
