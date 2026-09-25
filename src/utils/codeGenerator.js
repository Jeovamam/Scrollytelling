/**
 * Generates standalone, production-ready HTML, CSS, and JS code for Scrollytelling.
 * Supports standard 2D images, short videos, and TRUE 360-degree Equirectangular WebGL Panoramas!
 */

export function generateHTML(slides, settings = {}) {
  const { title = "Tour Virtual - Landing Page", theme = "dark" } = settings;
  const has360 = slides.some(s => s.is360);

  const slidesMarkup = slides.map((slide, index) => {
    const isVideo = slide.type === 'video' || slide.file?.type?.startsWith('video/');
    const is360 = !!slide.is360;
    const src = slide.fileName ? `assets/${slide.fileName}` : slide.url;
    
    let mediaTag = '';
    if (is360) {
      mediaTag = `
        <div id="panorama-${index}" class="scrolly-panorama" data-src="${src}"></div>
        <div class="scrolly-360-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span>Visão 360° Interativa (Arraste para girar)</span>
        </div>`;
    } else if (isVideo) {
      mediaTag = `<video src="${src}" autoplay muted loop playsinline class="scrolly-media"></video>`;
    } else {
      mediaTag = `<img src="${src}" alt="${escapeHtml(slide.title || 'Slide ' + (index + 1))}" class="scrolly-media" loading="${index === 0 ? 'eager' : 'lazy'}" />`;
    }

    const posClass = `pos-${slide.captionPosition || 'bottom-left'}`;
    const themeClass = `theme-${slide.overlayTheme || 'dark'}`;

    return `
      <!-- Slide ${index + 1}: ${escapeHtml(slide.title || 'Ambiente')} ${is360 ? '(Equirretangular 360° WebGL)' : ''} -->
      <div class="scrolly-slide" data-slide-index="${index}" data-is-360="${is360}">
        <div class="scrolly-media-wrapper">
          ${mediaTag}
          <div class="scrolly-overlay"></div>
        </div>
        ${(slide.title || slide.caption) ? `
        <div class="scrolly-caption-box ${posClass} ${themeClass}">
          ${slide.title ? `<h3 class="scrolly-title">${escapeHtml(slide.title)}</h3>` : ''}
          ${slide.caption ? `<p class="scrolly-desc">${escapeHtml(slide.caption)}</p>` : ''}
          <div class="scrolly-badge">
            <span>${String(index + 1).padStart(2, '0')}</span> / ${String(slides.length).padStart(2, '0')}
            ${is360 ? ' &bull; PANORAMA 360°' : ''}
          </div>
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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="scrolly-body">

  <!-- Header opcional da sua Landing Page -->
  <header class="lp-header">
    <div class="lp-container">
      <span class="lp-logo">Empresarial & Real Estate</span>
      <a href="#contato" class="lp-btn">Agendar Visita</a>
    </div>
  </header>

  <!-- SEÇÃO DE SCROLLYTELLING (TOUR VIRTUAL IMPERDÍVEL) -->
  <section class="scrollytelling-section" id="tour-virtual">
    <div class="scrollytelling-sticky-viewport">
      <div class="scrollytelling-slides-wrapper">
        ${slidesMarkup}
      </div>
      
      <!-- Indicador de Scroll -->
      <div class="scrolly-scroll-hint">
        <span class="mouse-icon"></span>
        <small>Role para explorar o espaço</small>
      </div>
    </div>
  </section>

  <!-- Conteúdo subsequente da Landing Page -->
  <section class="lp-content-section" id="contato">
    <div class="lp-container">
      <h2>Gostou da experiência?</h2>
      <p>Entre em contato com nossa equipe comercial e receba a apresentação técnica completa.</p>
    </div>
  </section>

  <!-- GSAP & ScrollTrigger CDN -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  ${has360 ? `
  <!-- Three.js CDN para Projeção Esférica 360° -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>` : ''}
  <script src="script.js"></script>
</body>
</html>`;
}

export function generateCSS(settings = {}) {
  const { zoomScale = 1.18 } = settings;

  return `/* ==========================================================================
   SCROLLYTELLING STYLES - SUPORTE 2D, VÍDEO E PROJEÇÃO ESFÉRICA 360° WEBGL
   ========================================================================== */

:root {
  --font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --color-dark-bg: #090d16;
  --color-text-light: #ffffff;
  --color-accent: #0284c7;
  --glass-bg: rgba(15, 23, 42, 0.65);
  --glass-border: rgba(255, 255, 255, 0.12);
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
  padding: 18px 24px;
  background: linear-gradient(to bottom, rgba(9, 13, 22, 0.9), transparent);
  backdrop-filter: blur(8px);
}
.lp-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lp-logo {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}
.lp-btn {
  background: var(--color-accent);
  color: #fff;
  padding: 10px 20px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 0.2s ease, background 0.2s ease;
}
.lp-btn:hover {
  transform: translateY(-2px);
  background: #0369a1;
}

/* Container de Scrollytelling */
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

/* Slide individual com suporte a sobreposição em profundidade */
.scrolly-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.scrolly-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1);
  will-change: transform;
}

/* Panorama 360° Viewer */
.scrolly-panorama {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
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
  background: rgba(9, 13, 22, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: #fbbf24;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.scrolly-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(9, 13, 22, 0.4) 0%,
    rgba(9, 13, 22, 0.2) 40%,
    rgba(9, 13, 22, 0.75) 100%
  );
  pointer-events: none;
}

/* Legendas Flutuantes e Posições */
.scrolly-caption-box {
  position: absolute;
  z-index: 10;
  max-width: 480px;
  width: calc(100% - 48px);
  padding: 24px 28px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  will-change: transform, opacity;
}

/* Temas da caixa de legenda */
.scrolly-caption-box.theme-dark {
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}
.scrolly-caption-box.theme-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.scrolly-caption-box.theme-minimal {
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 0;
}

/* Posicionamentos */
.scrolly-caption-box.pos-bottom-left {
  bottom: 48px;
  left: 48px;
}
.scrolly-caption-box.pos-bottom-right {
  bottom: 48px;
  right: 48px;
}
.scrolly-caption-box.pos-center-left {
  top: 50%;
  left: 48px;
  transform: translateY(-50%);
}
.scrolly-caption-box.pos-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.scrolly-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 10px;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.scrolly-desc {
  font-size: 0.98rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 14px;
}

.scrolly-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  text-transform: uppercase;
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
  opacity: 0.7;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 20;
}
.scrolly-scroll-hint small {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.mouse-icon {
  width: 20px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  position: relative;
}
.mouse-icon::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 50%;
  width: 4px;
  height: 6px;
  margin-left: -2px;
  background: white;
  border-radius: 2px;
  animation: scrollAnim 1.8s infinite ease-in-out;
}

@keyframes scrollAnim {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(12px); opacity: 0; }
}

/* Seção pós-tour */
.lp-content-section {
  padding: 120px 24px;
  background-color: #0c121e;
  text-align: center;
}
.lp-content-section h2 {
  font-size: 2.2rem;
  margin-bottom: 16px;
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
    font-size: 1.35rem;
  }
  .scrolly-desc {
    font-size: 0.88rem;
  }
}
`;
}

export function generateJS(slides, settings = {}) {
  const { zoomScale = 1.18, scrubDuration = 1 } = settings;
  const slideCount = slides.length;

  return `/* ==========================================================================
   SCROLLYTELLING ENGINE (GSAP + ScrollTrigger + Three.js 360 WebGL Sphere)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector("#tour-virtual");
  const slides = gsap.utils.toArray(".scrolly-slide");
  const slideCount = slides.length;
  const panViewers = {};

  if (!section || slideCount === 0) return;

  // Função para inicializar o visualizador de esfera 360° equirretangular com Three.js
  function createThree360Viewer(container, imageSrc) {
    if (!window.THREE || !container) return null;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Criar geometria esférica e inverter normais para a câmera ficar no centro
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.load(imageSrc, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    });

    let currentYaw = 0;
    function updateYaw(newYaw) {
      currentYaw = newYaw;
      const phi = THREE.MathUtils.degToRad(90);
      const theta = THREE.MathUtils.degToRad(currentYaw);
      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(targetX, targetY, targetZ);
    }

    function animate() {
      requestAnimationFrame(animate);
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

  // Inicializar slides 360
  slides.forEach((slide, i) => {
    const is360 = slide.getAttribute("data-is-360") === "true";
    const panElem = slide.querySelector(".scrolly-panorama");

    if (is360 && panElem) {
      const src = panElem.getAttribute("data-src");
      panViewers[i] = createThree360Viewer(panElem, src);
    }
  });

  section.style.height = \`\${slideCount * 100}vh\`;

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
        tl.to(media, { scale: ${zoomScale}, ease: "power1.inOut" }, 0);
      }
    } else {
      tl.to(slide, {
        autoAlpha: 1,
        duration: 1,
        ease: "power2.out"
      }, i - 0.2);

      if (media) {
        tl.fromTo(media, 
          { scale: 1.25 },
          { scale: 1, duration: 1.2, ease: "power1.out" },
          i - 0.2
        );
      }

      if (i < slideCount - 1 && media) {
        tl.to(media, {
          scale: ${zoomScale},
          duration: 1,
          ease: "power1.inOut"
        }, i + 0.5);
      }
    }

    // Se for 360°, rotação panorâmica sincronizada com o scroll
    if (is360 && panViewers[i]) {
      const dummyObj = { yaw: 0 };
      tl.to(dummyObj, {
        yaw: 360,
        ease: "none",
        onUpdate: function () {
          if (panViewers[i]) panViewers[i].updateYaw(dummyObj.yaw);
        },
        duration: 1.5
      }, i === 0 ? 0 : i - 0.1);
    }

    if (caption) {
      tl.fromTo(caption,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        i === 0 ? 0.1 : i - 0.1
      );

      if (i < slideCount - 1) {
        tl.to(caption, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: "power2.in"
        }, i + 0.6);
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
