import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function PanoramaViewer360({ url, yaw = 0, pitch = 0, interactive = true, className = '' }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clean old canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Equirectangular Sphere Geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      },
      undefined,
      (err) => {
        console.warn('Erro ao carregar textura 360:', err);
      }
    );

    // Interaction states
    let isUserInteracting = false;
    let isScrolling = false;
    let scrollTimeout = null;

    let onPointerDownMouseX = 0;
    let onPointerDownMouseY = 0;
    let lon = yaw;
    let lat = pitch;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    // Mouse Hover (1 Dedo / Cursor) offsets suaves com limite de ±25°
    let hoverYawOffset = 0;
    let hoverPitchOffset = 0;

    // Detectar rolagem de 2 dedos (scroll) para congelar desvios da câmera enquanto avança/retrocede
    const handleWheelScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 180);
    };

    const onMouseMoveHover = (event) => {
      if (isUserInteracting || !interactive || isScrolling) return;
      
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Normalizado do centro (-0.5 a +0.5) com Deadzone no meio
      let normX = (mouseX / rect.width) - 0.5;
      let normY = (mouseY / rect.height) - 0.5;

      // Aplicar zona morta suave no centro (deadzone)
      if (Math.abs(normX) < 0.08) normX = 0;
      if (Math.abs(normY) < 0.08) normY = 0;

      // Limitar desvio de visão em 1 dedo para ±25° (suave e controlado)
      hoverYawOffset = normX * 50; 
      hoverPitchOffset = -normY * 25;
    };

    const onPointerDown = (event) => {
      if (!interactive) return;
      isUserInteracting = true;
      const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      onPointerDownMouseX = clientX;
      onPointerDownMouseY = clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event) => {
      if (!isUserInteracting || !interactive) return;
      const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      lon = (onPointerDownMouseX - clientX) * 0.15 + onPointerDownLon;
      lat = (clientY - onPointerDownMouseY) * 0.15 + onPointerDownLat;
      lat = Math.max(-85, Math.min(85, lat));
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    const domElement = renderer.domElement;
    window.addEventListener('wheel', handleWheelScroll, { passive: true });
    container.addEventListener('mousemove', onMouseMoveHover);
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isUserInteracting) {
        // Quando está rolando com 2 dedos (isScrolling), zerar desvios laterais para avançar reto!
        const targetHoverYaw = isScrolling ? 0 : hoverYawOffset;
        const targetHoverPitch = isScrolling ? 0 : hoverPitchOffset;

        const targetLon = yaw + targetHoverYaw;
        const targetLat = pitch + targetHoverPitch;

        // Amortecimento LERP ultrassuave (4%)
        lon += (targetLon - lon) * 0.04;
        lat += (targetLat - lat) * 0.04;
      }

      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    sceneRef.current = { renderer, scene, resizeObserver };

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('wheel', handleWheelScroll);
      container.removeEventListener('mousemove', onMouseMoveHover);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
    };
  }, [url, interactive, yaw, pitch]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative cursor-crosshair ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
