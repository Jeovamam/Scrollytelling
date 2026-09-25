/**
 * Client-side Video-to-Frame Sequence Extractor.
 * Extracts N evenly spaced high-quality frames from a video file using HTML5 Video + Canvas.
 */

export async function extractFramesFromVideo(videoFileOrUrl, options = {}, onProgress) {
  const {
    fps = 15,          // Frames to extract per second of video
    maxFrames = 60,    // Safety limit for memory efficiency
    maxWidth = 1280,   // Max width for extracted frames
    quality = 0.82     // JPEG compression quality (82% for optimal balance of sharpness and weight)
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    const url = typeof videoFileOrUrl === 'string' 
      ? videoFileOrUrl 
      : URL.createObjectURL(videoFileOrUrl);

    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || isNaN(duration) || duration === Infinity) {
        reject(new Error('Duração do vídeo inválida.'));
        return;
      }

      // Calculate total frames
      let totalFrames = Math.min(Math.floor(duration * fps), maxFrames);
      if (totalFrames < 5) totalFrames = 5; // Minimum 5 frames

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Aspect ratio scale
      let width = video.videoWidth || 1280;
      let height = video.videoHeight || 720;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;

      const frames = [];

      for (let i = 0; i < totalFrames; i++) {
        const time = (i / (totalFrames - 1)) * (duration - 0.05);
        if (onProgress) {
          onProgress(Math.round(((i + 1) / totalFrames) * 100), i + 1, totalFrames);
        }

        // Seek video to exact frame time
        await seekVideoToTime(video, time);

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Export blob & dataURL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

        const fileName = `frame_${String(i + 1).padStart(3, '0')}.jpg`;

        frames.push({
          index: i,
          time,
          dataUrl,
          blob,
          fileName,
          width,
          height
        });
      }

      if (typeof videoFileOrUrl !== 'string') {
        URL.revokeObjectURL(url);
      }

      resolve({
        duration,
        totalFrames: frames.length,
        width,
        height,
        frames
      });
    };

    video.onerror = (err) => {
      reject(new Error('Não foi possível carregar o vídeo para extração de quadros.'));
    };
  });
}

function seekVideoToTime(video, time) {
  return new Promise((resolve) => {
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      resolve();
    };
    video.addEventListener('seeked', handleSeeked);
    video.currentTime = time;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
