/**
 * "Passeio" entre duas imagens: gera uma sequência de quadros que simula caminhar da
 * imagem inicial (ex.: entrada) até a final (ex.: interior do ambiente).
 *
 * Técnica: avanço de câmera (zoom em direção a um ponto de entrada) na imagem A,
 * dissolução em meio ao avanço e continuação do avanço na imagem B até assentar.
 * O resultado tem o mesmo formato da extração de vídeo e entra direto no Canvas Sequence.
 */

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Escala e opacidade de cada imagem para o progresso t (0..1) do passeio. */
export function walkthroughParams(t, { zoomA = 2.0, zoomB = 1.45 } = {}) {
  const mix = smoothstep(0.42, 0.72, t);          // dissolução A -> B
  const advanceA = smoothstep(0, 0.72, t);        // A só avança até concluir a dissolução
  const settleB = smoothstep(0.42, 1, t);         // B começa "dentro" e assenta em 1.0
  return {
    a: { scale: 1 + (zoomA - 1) * advanceA, alpha: 1 - mix },
    b: { scale: zoomB - (zoomB - 1) * settleB, alpha: mix }
  };
}

function loadImage(fileOrUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const isFile = typeof fileOrUrl !== 'string';
    const url = isFile ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
    img.onload = () => {
      if (isFile) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (isFile) URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar uma das imagens.'));
    };
    img.src = url;
  });
}

function drawCover(ctx, img, w, h, scale, focalX, focalY, alpha) {
  if (alpha <= 0) return;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * base * scale;
  const ih = img.naturalHeight * base * scale;
  // mantém o ponto focal fixo na tela enquanto a escala cresce
  const fx = w * focalX;
  const fy = h * focalY;
  const x0 = (w - img.naturalWidth * base) / 2;
  const y0 = (h - img.naturalHeight * base) / 2;
  const x = fx - (fx - x0) * scale;
  const y = fy - (fy - y0) * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x, y, iw, ih);
}

export async function generateWalkthroughFrames(fileA, fileB, options = {}, onProgress) {
  const {
    frames: totalFrames = 60,
    width = 1280,
    zoomA = 2.0,
    zoomB = 1.45,
    focalX = 0.5,
    focalY = 0.55,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  const [imgA, imgB] = await Promise.all([loadImage(fileA), loadImage(fileB)]);
  const height = Math.round((width * 9) / 16);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const extension = format === 'image/webp' ? 'webp' : 'jpg';
  const result = [];

  try {
    for (let i = 0; i < totalFrames; i++) {
      const p = walkthroughParams(i / (totalFrames - 1), { zoomA, zoomB });
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      drawCover(ctx, imgA, width, height, p.a.scale, focalX, focalY, 1); // base opaca evita "buracos"
      drawCover(ctx, imgB, width, height, p.b.scale, focalX, focalY, p.b.alpha);
      ctx.globalAlpha = 1;

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, quality));
      if (!blob) throw new Error('Falha ao gerar um dos quadros do passeio.');
      const objectUrl = URL.createObjectURL(blob);
      result.push({
        index: i,
        time: i / (totalFrames - 1),
        url: objectUrl,
        objectUrl,
        blob,
        fileName: `frame_${String(i + 1).padStart(3, '0')}.${extension}`,
        width,
        height
      });
      if (onProgress) onProgress(Math.round(((i + 1) / totalFrames) * 100));
    }
  } catch (err) {
    result.forEach((f) => URL.revokeObjectURL(f.objectUrl));
    throw err;
  }

  return { duration: 0, totalFrames: result.length, width, height, frames: result };
}
