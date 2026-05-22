export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // avoid CORS issues
    image.src = url;
  });

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the co-ordinates and dimensions of the rotated image
 */
export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crop the image based on selected pixel crops and rotation angles with background colors and custom sizes
 */
export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  bgColor = '#ffffff',
  targetSize = null, // { width, height } in pixels
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central point on canvas to draw image rotated
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas based on targetSize or original crop size
  const canvasWidth = targetSize ? targetSize.width : pixelCrop.width;
  const canvasHeight = targetSize ? targetSize.height : pixelCrop.height;

  croppedCanvas.width = canvasWidth;
  croppedCanvas.height = canvasHeight;

  // Draw background color on cropped canvas
  if (bgColor) {
    croppedCtx.fillStyle = bgColor;
    croppedCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Draw the cropped image onto the new canvas (resizing dynamically if targetSize is set)
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  // Return base64 JPEG format representation
  return croppedCanvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Generate an A4 printable sheet canvas with a grid of passport photos
 */
export async function generatePrintSheetCanvas({
  imageSrc,
  photoWidthMm,
  photoHeightMm,
  layoutCount
}) {
  const dpi = 300;
  const mmToPx = (mm) => Math.round((mm * dpi) / 25.4);

  // A4 dimensions: 210mm x 297mm
  const canvasWidth = mmToPx(210);
  const canvasHeight = mmToPx(297);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Fill pure white printable background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Load cropped image
  const img = await createImage(imageSrc);

  const photoWidthPx = mmToPx(photoWidthMm);
  const photoHeightPx = mmToPx(photoHeightMm);

  // Layout geometry calculations
  let cols = 2;
  let rows = 2;
  if (layoutCount === 6) {
    cols = 3;
    rows = 2;
  } else if (layoutCount === 8) {
    cols = 4;
    rows = 2;
  }

  const gapPx = mmToPx(10); // 10mm margins/gaps
  const totalGridWidth = cols * photoWidthPx + (cols - 1) * gapPx;
  const totalGridHeight = rows * photoHeightPx + (rows - 1) * gapPx;

  // Centering coordinate calculations
  const startX = (canvasWidth - totalGridWidth) / 2;
  const startY = (canvasHeight - totalGridHeight) / 2;

  // Draw photos and cut guides
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (photoWidthPx + gapPx);
      const y = startY + r * (photoHeightPx + gapPx);

      // Draw photo block
      ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);

      // Draw light grey cutting guides
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = Math.max(1, Math.round(dpi / 300)); // thin line
      ctx.setLineDash([Math.round(dpi / 50), Math.round(dpi / 50)]); // clean dotted dashes
      ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
    }
  }

  return canvas;
}

/**
 * Crop the signature area and apply binarization/whitening cleanup filters
 */
export async function getCleanedSignatureImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  brightness = 0,
  contrast = 0,
  threshold = 140,
  inkColor = 'original',
  transparentBg = false
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Fill white or transparent base
  croppedCtx.fillStyle = transparentBg ? 'rgba(0,0,0,0)' : '#ffffff';
  croppedCtx.fillRect(0, 0, pixelCrop.width, pixelCrop.height);

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Apply binarization / signature cleaning filters
  const imgData = croppedCtx.getImageData(0, 0, pixelCrop.width, pixelCrop.height);
  const data = imgData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r += brightness;
    g += brightness;
    b += brightness;

    // Apply contrast
    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    // Calculate luminance (Greyscale value)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luminance > threshold) {
      if (transparentBg) {
        data[i + 3] = 0; // Alpha
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    } else {
      // Ink styling
      if (inkColor === 'black') {
        const val = Math.max(0, Math.min(255, luminance - 30));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      } else if (inkColor === 'blue') {
        const val = Math.max(0, Math.min(255, luminance - 20));
        data[i] = Math.max(0, val - 40);
        data[i + 1] = Math.max(0, val - 20);
        data[i + 2] = Math.min(255, val + 60);
      } else {
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }
    }
  }

  croppedCtx.putImageData(imgData, 0, 0);
  return croppedCanvas.toDataURL(transparentBg ? 'image/png' : 'image/jpeg');
}
