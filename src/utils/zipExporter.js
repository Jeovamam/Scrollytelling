import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateHTML, generateCSS, generateJS } from './codeGenerator';

/**
 * Downloads a complete ZIP package containing index.html, styles.css, script.js and assets/
 */
export async function exportToZip(slides, settings = {}, onProgress) {
  const zip = new JSZip();
  const assetsFolder = zip.folder('assets');

  if (onProgress) onProgress('Gerando arquivos de código...');

  // 1. Generate code content
  const htmlContent = generateHTML(slides, settings);
  const cssContent = generateCSS(settings);
  const jsContent = generateJS(slides, settings);

  zip.file('index.html', htmlContent);
  zip.file('styles.css', cssContent);
  zip.file('script.js', jsContent);
  zip.file('README.md', `# Tour Virtual Scrollytelling (Landing Page)

Este pacote foi gerado pelo **Scrollytelling Builder**.

## Como utilizar na sua Landing Page:

1. Extraia o conteúdo deste arquivo .zip para a pasta do seu projeto.
2. Abra o arquivo \`index.html\` no seu navegador ou integre a seção de Scrollytelling na sua Landing Page (WordPress, Webflow, React, HTML5, etc.).
3. A pasta \`assets/\` contém todas as imagens, sequências de quadros de vídeo (estilo Apple) e mídias 360°.
4. O efeito de rolagem utiliza GSAP ScrollTrigger via CDN oficial para máxima leveza e fluidez a 60fps.
`);

  // 2. Fetch and add media assets
  const total = slides.length;
  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    if (onProgress) onProgress(`Empacotando mídias (${i + 1}/${total})...`);

    if (slide.isCanvasSequence && slide.sequenceData?.frames) {
      const framesFolder = assetsFolder.folder(`frames_slide_${i + 1}`);
      const frames = slide.sequenceData.frames;

      for (let f = 0; f < frames.length; f++) {
        const frame = frames[f];
        if (frame.blob) {
          framesFolder.file(frame.fileName, frame.blob);
        }
      }
    } else {
      const fileName = slide.fileName || `slide-${i + 1}.${slide.type === 'video' ? 'mp4' : 'jpg'}`;

      try {
        if (slide.file) {
          assetsFolder.file(fileName, slide.file);
        } else if (slide.url) {
          const response = await fetch(slide.url);
          if (response.ok) {
            const blob = await response.blob();
            assetsFolder.file(fileName, blob);
          }
        }
      } catch (err) {
        console.warn(`Aviso ao baixar mídia ${fileName}:`, err);
      }
    }
  }

  if (onProgress) onProgress('Finalizando arquivo .zip...');

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'scrollytelling-landing-page.zip');
}
