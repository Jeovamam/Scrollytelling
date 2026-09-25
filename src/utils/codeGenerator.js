/**
 * Generates standalone, production-ready HTML, CSS, and JS code for Scrollytelling.
 * Specialization: Hyper-realistic "Adentrar no Imóvel" + Smooth 360 LERP Damping.
 */

export function generateHTML(slides, settings = {}) {
  const { title = "Tour Virtual Imersivo - Landing Page Real Estate" } = settings;
  const has360 = slides.some(s => s.is360);

  const slidesMarkup = slides.map((slide, index) => {
    const isVideo = slide.type === 'video' || slide.file?.type?.startsWith('video/');
    const is360 = !!slide.is360;
    const isCanvasSeq = !!slide.isCanvasSequence;
    const src = slide.fileName ? `assets/${slide.fileName}` : slide.url;
    
    let mediaTag = '';
    if (isCanvasSeq) {
      mediaTag = `
        <canvas id="canvas-seq-${index}" class="scrolly-canvas-seq" data-frames-dir="assets/frames_slide_${index + 1}"></canvas>
        <div class="scrolly-360-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
          <span>Sequência Canvas 60fps</span>
        </div>`;
    } else if (is360) {
      mediaTag = `
        <div id="panorama-${index}" class="scrolly-panorama" data-src="${src}"></div>
        <div class="scrolly-360-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span>Visão 360° Interativa (Arraste para girar)</span>
        </div>`;
    } else if (isVideo) {
      mediaTag = `<video src="${src}" autoplay muted loop playsinline class="scrolly-media"></video>`;
    } else {
      mediaTag = `<img src="${src}" alt="${escapeHtml(slide.title || 'Ambiente ' + (index + 1))}" class="scrolly-media" loading="${index === 0 ? 'eager' : 'lazy'}" />`;
    }

    const posClass = `pos-${slide.captionPosition || 'bottom-left'}`;
    const themeClass = `theme-${slide.overlayTheme || 'dark'}`;

    return `
      <!-- Slide ${index + 1}: ${escapeHtml(slide.title || 'Ambiente')} -->
      <div class="scrolly-slide" data-slide-index="${index}" data-is-360="${is360}" data-is-canvas="${isCanvasSeq}">
        <div class="scrolly-media-wrapper">
          ${mediaTag}
          <div class="scrolly-overlay"></div>
        </div>
        ${(slide.title || slide.caption) ? `
        <div class="scrolly-caption-box ${posClass} ${themeClass}">
          <div class="scrolly-step-tag">
            <span class="step-num">${String(index + 1).padStart(2, '0')}</span>
            <span class="step-divider">/</span>
            <span class="step-total">${String(slides.length).padStart(2, '0')}</span>
            <span class="step-label">Passo a Passo do Imóvel</span>
          </div>
          ${slide.title ? `<h3 class="scrolly-title">${escapeHtml(slide.title)}</h3>` : ''}
          ${slide.caption ? `<p class="scrolly-desc">${escapeHtml(slide.caption)}</p>` : ''}
        </div>` : ''}
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  
  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="scrolly-body">

  <!-- Header opcional da sua Landing Page -->
  <header class="lp-header">
    <div class="lp-container">
      <span class="lp-logo">RESIDENCIAL & EXCLUSIVE REAL ESTATE</span>
      <a href="#contato" class="lp-btn">Agendar Visita Guiada</a>
    </div>
  </header>

  <!-- SEÇÃO DE SCROLLYTELLING -->
  <section class="scrollytelling-section" id="tour-virtual">
    <div class="scrollytelling-sticky-viewport">
      <div class="scrollytelling-slides-wrapper">
        ${slidesMarkup}
      </div>
      
      <!-- Indicador de Navegação -->
      <div class="scrolly-scroll-hint">
        <div class="mouse-icon"></div>
        <small>Role para avançar e adentrar nos ambientes</small>
      </div>
    </div>
  </section>

  <!-- Conteúdo subsequente da Landing Page -->
  <section class="lp-content-section" id="contato">
    <div class="lp-container">
      <h2>Pronto para conhecer este imóvel pessoalmente?</h2>
      <p>Nossa equipe de especialistas está a postos para agendar sua visita exclusiva.</p>
    </div>
  </section>

  <!-- GSAP & ScrollTrigger CDN -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  ${has360 ? `
  <!-- Three.js CDN para Projeção 360° -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>` : ''}
  <script src="script.js"></script>
</body>
</html>`;
}

export function generateCSS(settings = {}) {
  const { zoomScale = 1.45 } = settings;

  return `/* ==========================================================================
   SCROLLYTELLING STYLES - EFEITO "ADENTRANDO NO IMÓVEL" (FLY-THROUGH WALKTHROUGH)
   ========================================================================== */

:root {
  --font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --color-dark-bg: #070a12;
  --color-text-light: #ffffff;
  --color-accent: #0284c7;
  --glass-bg: rgba(7, 10, 18, 0.75);
  --glass-border: rgba(255, 255, 255, 0.14);
  --zoom-max: ${zoomScale};
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body.scrolly-body {
  font-family: var(--font-family);
  background-color: var(--color-dark-bg);
  color: var(--color-text-light);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Header de Exemplo */
.lp-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 18px 32px;
  background: linear-gradient(to bottom, rgba(7, 10, 18, 0.95), transparent);
  backdrop-filter: blur(12px);
}
.lp-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lp-logo {
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.lp-btn {
  background: var(--color-accent);
  color: #fff;
  padding: 10px 24px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
}
.lp-btn:hover {
  transform: translateY(-2px);
  background: #0369a1;
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6);
}

/* Container de Scrollytelling Pinned */
.scrollytelling-section {
  position: relative;
  width: 100%;
}

.scrollytelling-sticky-viewport {
  position: sticky;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

.scrollytelling-slides-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Slide individual */
.scrolly-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity, filter;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
}

.scrolly-slide[data-slide-index="0"] {
  opacity: 1;
  visibility: visible;
}

.scrolly-media-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transform-origin: center center;
}

.scrolly-media, .scrolly-canvas-seq {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1);
  will-change: transform, filter;
  display: block;
}

/* Panorama 360° Viewer */
.scrolly-panorama {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  cursor: grab;
}
.scrolly-panorama:active {
  cursor: grabbing;
}
.scrolly-panorama canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.scrolly-360-badge {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  background: rgba(7, 10, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: #fbbf24;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.scrolly-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    transparent 20%,
    rgba(7, 10, 18, 0.4) 60%,
    rgba(7, 10, 18, 0.85) 100%
  );
  pointer-events: none;
}

/* Legendas Flutuantes com Tag de Passo a Passo */
.scrolly-caption-box {
  position: absolute;
  z-index: 10;
  max-width: 520px;
  width: calc(100% - 48px);
  padding: 28px 32px;
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  will-change: transform, opacity;
}

.scrolly-step-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.scrolly-step-tag .step-num {
  font-size: 0.95rem;
}
.scrolly-step-tag .step-divider {
  opacity: 0.4;
}
.scrolly-step-tag .step-label {
  margin-left: 4px;
  opacity: 0.8;
  font-size: 0.7rem;
}

/* Temas da caixa de legenda */
.scrolly-caption-box.theme-dark {
  background: rgba(7, 10, 18, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
}
.scrolly-caption-box.theme-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.scrolly-caption-box.theme-minimal {
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 0;
}

/* Posicionamentos */
.scrolly-caption-box.pos-bottom-left {
  bottom: 56px;
  left: 56px;
}
.scrolly-caption-box.pos-bottom-right {
  bottom: 56px;
  right: 56px;
}
.scrolly-caption-box.pos-center-left {
  top: 50%;
  left: 56px;
  transform: translateY(-50%);
}
.scrolly-caption-box.pos-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.scrolly-title {
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 12px;
  color: #ffffff;
  letter-spacing: -0.025em;
}

.scrolly-desc {
  font-size: 0.95rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);
}

/* Indicador de Scroll */
.scrolly-scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.8;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 20;
}
.scrolly-scroll-hint small {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}
.mouse-icon {
  width: 22px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  position: relative;
}
.mouse-icon::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 50%;
  width: 4px;
  height: 8px;
  margin-left: -2px;
  background: white;
  border-radius: 2px;
  animation: scrollAnim 1.6s infinite cubic-bezier(0.65, 0, 0.35, 1);
}

@keyframes scrollAnim {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(14px); opacity: 0; }
}

/* Seção pós-tour */
.lp-content-section {
  padding: 120px 24px;
  background-color: #070a12;
  text-align: center;
}
.lp-content-section h2 {
  font-size: 2.4rem;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

/* Responsividade Mobile */
@media (max-width: 768px) {
  .scrolly-caption-box.pos-bottom-left,
  .scrolly-caption-box.pos-bottom-right,
  .scrolly-caption-box.pos-center-left {
    bottom: 24px;
    left: 24px;
    right: 24px;
    top: auto;
    transform: none;
    max-width: none;
    width: calc(100% - 48px);
  }
  .scrolly-title {
    font-size: 1.45rem;
  }
  .scrolly-desc {
    font-size: 0.88rem;
  }
}
`;
}

export function generateJS(slides, settings = {}) {
  const { zoomScale = 1.45, scrubDuration = 1 } = settings;
  const slideCount = slides.length;

  return `/* ==========================================================================
   SCROLLYTELLING ENGINE - FLY-THROUGH + SMOOTH 360 LERP DAMPING
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector("#tour-virtual");
  const slides = gsap.utils.toArray(".scrolly-slide");
  const slideCount = slides.length;
  const panViewers = {};

  if (!section || slideCount === 0) return;

  // Função para inicializar o visualizador 360 com amortecimento LERP ultra-suave
  function createThree360Viewer(container, imageSrc) {
    if (!window.THREE || !container) return null;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.load(imageSrc, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    });

    // Estado da interação e amortecimento LERP
    let targetYaw = 0;
    let targetPitch = 0;
    let currentLon = 0;
    let currentLat = 0;
    let isUserInteracting = false;
    let onPointerDownMouseX = 0;
    let onPointerDownMouseY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    const onPointerDown = (event) => {
      isUserInteracting = true;
      const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      onPointerDownMouseX = clientX;
      onPointerDownMouseY = clientY;
      onPointerDownLon = currentLon;
      onPointerDownLat = currentLat;
    };

    const onPointerMove = (event) => {
      if (!isUserInteracting) return;
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
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    function updateYaw(newYaw) {
      targetYaw = newYaw;
    }

    function animate() {
      requestAnimationFrame(animate);

      if (!isUserInteracting) {
        // Amortecimento LERP suave a 5% por frame (sem retorno abrupto ao soltar)
        currentLon += (targetYaw - currentLon) * 0.05;
        currentLat += (targetPitch - currentLat) * 0.05;
      }

      const phi = THREE.MathUtils.degToRad(90 - currentLat);
      const theta = THREE.MathUtils.degToRad(currentLon);
      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      const rw = container.clientWidth || window.innerWidth;
      const rh = container.clientHeight || window.innerHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    });

    return { updateYaw };
  }

  // Inicializar slides 360°
  slides.forEach((slide, i) => {
    const is360 = slide.getAttribute("data-is-360") === "true";
    const panElem = slide.querySelector(".scrolly-panorama");

    if (is360 && panElem) {
      const src = panElem.getAttribute("data-src");
      panViewers[i] = createThree360Viewer(panElem, src);
    }
  });

  section.style.height = \`\${slideCount * 110}vh\`;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: ${scrubDuration},
      anticipatePin: 1
    }
  });

  slides.forEach((slide, i) => {
    const media = slide.querySelector(".scrolly-media");
    const caption = slide.querySelector(".scrolly-caption-box");
    const is360 = slide.getAttribute("data-is-360") === "true";

    if (i === 0) {
      if (media) {
        tl.to(media, { scale: ${zoomScale}, ease: "none" }, 0);
      }
    } else {
      tl.to(slide, {
        autoAlpha: 1,
        duration: 1,
        ease: "power2.out"
      }, i - 0.35);

      if (media) {
        tl.fromTo(media, 
          { scale: 1.35 },
          { scale: 1.0, duration: 1.1, ease: "power1.out" },
          i - 0.35
        );
      }

      if (i < slideCount - 1 && media) {
        tl.to(media, {
          scale: ${zoomScale},
          duration: 1,
          ease: "none"
        }, i + 0.4);
      }
    }

    if (is360 && panViewers[i]) {
      const dummyObj = { yaw: 0 };
      tl.to(dummyObj, {
        yaw: 360,
        ease: "none",
        onUpdate: function () {
          if (panViewers[i]) panViewers[i].updateYaw(dummyObj.yaw);
        },
        duration: 1.5
      }, i === 0 ? 0 : i - 0.2);
    }

    if (caption) {
      tl.fromTo(caption,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out" },
        i === 0 ? 0.1 : i - 0.15
      );

      if (i < slideCount - 1) {
        tl.to(caption, {
          opacity: 0,
          y: -30,
          scale: 0.95,
          duration: 0.45,
          ease: "power2.in"
        }, i + 0.55);
      }
    }
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  });
});
`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
