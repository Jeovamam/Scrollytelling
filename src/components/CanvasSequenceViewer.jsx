import React, { useRef, useEffect } from 'react';

/**
 * Canvas Sequence Viewer (Apple-style scrollytelling frame sequence renderer)
 * Features continuous 60fps RAF LERP damping for ultra-smooth frame scrubbing.
 */
export default function CanvasSequenceViewer({ frames = [], currentFrameIndex = 0, className = '' }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const targetFrameRef = useRef(currentFrameIndex);
  const currentFrameRef = useRef(currentFrameIndex);

  // Synchronize target frame index
  useEffect(() => {
    targetFrameRef.current = currentFrameIndex;
  }, [currentFrameIndex]);

  // Preload images into memory
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    imagesRef.current = frames.map((frame) => {
      const img = new Image();
      img.src = frame.objectUrl || frame.url || frame.dataUrl;
      return img;
    });
  }, [frames]);

  // Draw frame on canvas with RAF LERP damping & object-fit cover logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let lastDrawnIndex = -1;

    const renderLoop = () => {
      const target = targetFrameRef.current;
      const diff = target - currentFrameRef.current;

      if (Math.abs(diff) > 0.001) {
        // 0.22 LERP factor creates silky smooth inertia without lag
        currentFrameRef.current += diff * 0.22;
      } else {
        currentFrameRef.current = target;
      }

      const frameIdx = Math.max(0, Math.min(Math.round(currentFrameRef.current), frames.length - 1));

      if (frameIdx !== lastDrawnIndex) {
        const img = imagesRef.current[frameIdx];
        if (img && (img.complete || img.naturalWidth > 0)) {
          const cw = canvas.width;
          const ch = canvas.height;
          const iw = img.naturalWidth || img.width || 1280;
          const ih = img.naturalHeight || img.height || 720;

          // Compute cover scaling
          const scale = Math.max(cw / iw, ch / ih);
          const nw = iw * scale;
          const nh = ih * scale;
          const cx = (cw - nw) / 2;
          const cy = (ch - nh) / 2;

          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(img, cx, cy, nw, nh);
          lastDrawnIndex = frameIdx;
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [frames]);

  // Handle Canvas Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
    />
  );
}
