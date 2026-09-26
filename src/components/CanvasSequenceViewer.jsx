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

    const renderLoop = () => {
      const target = targetFrameRef.current;
      const diff = target - currentFrameRef.current;

      if (Math.abs(diff) > 0.0001) {
        currentFrameRef.current += diff * 0.18;
      } else {
        currentFrameRef.current = target;
      }

      const totalCount = frames.length;
      const currentVal = Math.max(0, Math.min(currentFrameRef.current, totalCount - 1));
      const frameA = Math.floor(currentVal);
      const frameB = Math.min(frameA + 1, totalCount - 1);
      const blendAmount = currentVal - frameA;

      const imgA = imagesRef.current[frameA];
      const imgB = imagesRef.current[frameB];

      if (imgA && (imgA.complete || imgA.naturalWidth > 0)) {
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = imgA.naturalWidth || imgA.width || 1280;
        const ih = imgA.naturalHeight || imgA.height || 720;

        // Compute cover scaling
        const scale = Math.max(cw / iw, ch / ih);
        const nw = iw * scale;
        const nh = ih * scale;
        const cx = (cw - nw) / 2;
        const cy = (ch - nh) / 2;

        ctx.clearRect(0, 0, cw, ch);

        // 1. Draw base frame A
        ctx.globalAlpha = 1.0;
        ctx.drawImage(imgA, cx, cy, nw, nh);

        // 2. Crossfade blend frame B on top for sub-frame liquidity
        if (frameA !== frameB && blendAmount > 0.005 && imgB && (imgB.complete || imgB.naturalWidth > 0)) {
          ctx.globalAlpha = blendAmount;
          ctx.drawImage(imgB, cx, cy, nw, nh);
          ctx.globalAlpha = 1.0;
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
