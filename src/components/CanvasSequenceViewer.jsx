import React, { useRef, useEffect } from 'react';

/**
 * Canvas Sequence Viewer (Apple-style scrollytelling frame sequence renderer)
 */
export default function CanvasSequenceViewer({ frames = [], currentFrameIndex = 0, className = '' }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);

  // Preload images into memory
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    imagesRef.current = frames.map((frame) => {
      const img = new Image();
      img.src = frame.objectUrl || frame.url || frame.dataUrl;
      return img;
    });
  }, [frames]);

  // Draw current frame on canvas with object-fit: cover logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    const index = Math.max(0, Math.min(currentFrameIndex, frames.length - 1));
    const img = imagesRef.current[index];

    if (!img) return;

    const render = () => {
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
    };

    if (img.complete) {
      render();
    } else {
      img.onload = render;
    }
  }, [currentFrameIndex, frames]);

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
