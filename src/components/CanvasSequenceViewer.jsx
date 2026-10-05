import React, { useRef, useEffect } from 'react';

/**
 * Canvas Sequence Viewer (Apple-style scrollytelling frame sequence renderer)
 * Features 60fps RAF LERP damping for ultra-smooth frame scrubbing.
 * The RAF loop sleeps once the target frame is reached and wakes on any change.
 */
export default function CanvasSequenceViewer({ frames = [], currentFrameIndex = 0, className = '' }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const targetFrameRef = useRef(currentFrameIndex);
  const currentFrameRef = useRef(currentFrameIndex);
  const wakeRef = useRef(null);

  // Synchronize target frame index and wake the render loop
  useEffect(() => {
    targetFrameRef.current = currentFrameIndex;
    wakeRef.current?.();
  }, [currentFrameIndex]);

  // Preload images into memory
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    imagesRef.current = frames.map((frame) => {
      const img = new Image();
      img.onload = () => wakeRef.current?.(true);
      img.src = frame.objectUrl || frame.url || frame.dataUrl;
      return img;
    });
  }, [frames]);

  // Draw frame on canvas with RAF LERP damping, object-fit cover and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let lastDrawnIndex = -1;

    const draw = (frameIdx) => {
      const img = imagesRef.current[frameIdx];
      if (!img || !(img.complete && img.naturalWidth > 0)) return false;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // Compute cover scaling
      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;

      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, (cw - nw) / 2, (ch - nh) / 2, nw, nh);
      return true;
    };

    const renderLoop = () => {
      animationFrameId = null;
      const target = targetFrameRef.current;
      const diff = target - currentFrameRef.current;
      const settled = Math.abs(diff) <= 0.001;

      if (settled) {
        currentFrameRef.current = target;
      } else {
        // 0.25 LERP factor for crisp, ultra-responsive 60fps tracking
        currentFrameRef.current += diff * 0.25;
      }

      const frameIdx = Math.max(0, Math.min(Math.round(currentFrameRef.current), frames.length - 1));
      let drawn = true;
      if (frameIdx !== lastDrawnIndex) {
        drawn = draw(frameIdx);
        if (drawn) lastDrawnIndex = frameIdx;
      }

      // Sleep when settled and drawn; image onload / target change / resize wake us up
      if (!settled || !drawn) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const wake = (forceRedraw = false) => {
      if (forceRedraw) lastDrawnIndex = -1;
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };
    wakeRef.current = wake;

    // Keep the canvas backing store in sync with its container (HiDPI aware)
    const parent = canvas.parentElement;
    const resize = () => {
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(parent.clientWidth * dpr);
      canvas.height = Math.round(parent.clientHeight * dpr);
      wake(true); // resizing clears the canvas, so redraw the current frame
    };

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (observer && parent) observer.observe(parent);
    else window.addEventListener('resize', resize);
    resize();

    return () => {
      wakeRef.current = null;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', resize);
    };
  }, [frames]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
    />
  );
}
