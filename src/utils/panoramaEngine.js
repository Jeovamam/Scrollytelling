import * as THREE from 'three';

/**
 * Pure WebGL 360 Panorama Viewer Engine using Three.js.
 * Can be used by React components or injected into standalone scripts.
 */
export function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function createPanoramaViewer(container, imageSrc, options = {}) {
  if (!isWebGLSupported()) {
    throw new Error('Seu navegador ou dispositivo não possui suporte a WebGL 360°.');
  }

  if (!container) return null;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // 1. Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // 2. Geometry
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  // References for resource cleanup
  let textureRef = null;
  let materialRef = null;
  let meshRef = null;

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    imageSrc,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      textureRef = texture;
      materialRef = new THREE.MeshBasicMaterial({ map: texture });
      meshRef = new THREE.Mesh(geometry, materialRef);
      scene.add(meshRef);
    },
    undefined,
    (err) => {
      console.warn('Erro ao carregar textura 360°:', err);
    }
  );

  // Controls state
  let targetYaw = options.yaw || 0;
  let targetPitch = options.pitch || 0;
  let hoverYawOffset = 0;
  let hoverPitchOffset = 0;
  let currentLon = targetYaw;
  let currentLat = targetPitch;
  let isUserInteracting = false;
  let isScrolling = false;
  let scrollTimeout = null;

  let onPointerDownMouseX = 0;
  let onPointerDownMouseY = 0;
  let onPointerDownLon = 0;
  let onPointerDownLat = 0;

  // 2-finger scroll detector to freeze camera tilt during page scroll
  const handleWheelScroll = () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 180);
  };

  const onMouseMoveHover = (event) => {
    if (isUserInteracting || isScrolling || options.interactive === false) return;
    const rect = container.getBoundingClientRect();
    let normX = ((event.clientX - rect.left) / rect.width) - 0.5;
    let normY = ((event.clientY - rect.top) / rect.height) - 0.5;

    if (Math.abs(normX) < 0.08) normX = 0;
    if (Math.abs(normY) < 0.08) normY = 0;

    hoverYawOffset = normX * 50;
    hoverPitchOffset = -normY * 25;
  };

  const onPointerDown = (event) => {
    if (options.interactive === false) return;
    isUserInteracting = true;
    const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
    onPointerDownMouseX = clientX;
    onPointerDownMouseY = clientY;
    onPointerDownLon = currentLon;
    onPointerDownLat = currentLat;
  };

  const onPointerMove = (event) => {
    if (!isUserInteracting || options.interactive === false) return;
    const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
    currentLon = (onPointerDownMouseX - clientX) * 0.15 + onPointerDownLon;
    currentLat = (clientY - onPointerDownMouseY) * 0.15 + onPointerDownLat;
    currentLat = Math.max(-85, Math.min(85, currentLat));
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

  let animationFrameId;
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    if (!isUserInteracting) {
      const targetHoverYaw = isScrolling ? 0 : hoverYawOffset;
      const targetHoverPitch = isScrolling ? 0 : hoverPitchOffset;

      const destLon = targetYaw + targetHoverYaw;
      const destLat = targetPitch + targetHoverPitch;
      currentLon += (destLon - currentLon) * 0.04;
      currentLat += (destLat - currentLat) * 0.04;
    }

    const phi = THREE.MathUtils.degToRad(90 - currentLat);
    const theta = THREE.MathUtils.degToRad(currentLon);
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

  function updateYaw(newYaw) {
    targetYaw = newYaw;
  }

  function destroy() {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('wheel', handleWheelScroll);
    container.removeEventListener('mousemove', onMouseMoveHover);
    domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    resizeObserver.disconnect();

    if (textureRef) textureRef.dispose();
    if (materialRef) materialRef.dispose();
    geometry.dispose();

    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
  }

  return { updateYaw, destroy };
}
