import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { Upload, X, Sliders, RefreshCw, Download, Image as ImageIcon, CheckCircle, AlertCircle, Palette, Maximize, Zap, Printer, FileText, FileImage, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getCroppedImg, generatePrintSheetCanvas } from '../utils/cropImage';
import SEO from '../components/SEO';
import { isSupportedImageFile } from '../utils/fileValidation';

export default function PassportPhoto() {
  const testImageSrc = new URLSearchParams(window.location.search).get('test') === 'true'
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAExJREFUeNrs0UENAAAMwzCdff9O7+ACWshkpqoCDmRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGQcDgEGAM5KAAHO4G9kAAAAAElFTkSuQmCC'
    : null;
  const [imageSrc, setImageSrc] = useState(testImageSrc);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedPreset, setSelectedPreset] = useState('35x45_mm');
  const [customWidth, setCustomWidth] = useState(35);
  const [customHeight, setCustomHeight] = useState(45);
  
  // Compression States
  const [compressPreset, setCompressPreset] = useState('50'); // '20', '50', '100', 'custom'
  const [customCompressKb, setCustomCompressKb] = useState(30);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedSizeKb, setCroppedSizeKb] = useState(0);
  const [compressedResult, setCompressedResult] = useState(null); // { url, sizeKb, sizeBytes }
  
  // Printable Sheet States
  const [sheetPhotosCount, setSheetPhotosCount] = useState(6);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState(null);
  const [sheetPngUrl, setSheetPngUrl] = useState(null);
  const [generatingSheet, setGeneratingSheet] = useState(false);

  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const fileInputRef = useRef(null);
  const fileInputId = 'passport-photo-file-input';
  const sheetCanvasRef = useRef(null);

  const presets = [
    { id: '35x45_mm', name: '35x45 mm (Indian/Schengen Passport)', label: '35 x 45 mm', helper: 'Indian Passport / Visa', widthMm: 35, heightMm: 45 },
    { id: '50x50_mm', name: '50.8x50.8 mm (US Visa / 2x2 Inch)', label: '2 x 2 inch', helper: 'US Visa / Passport', widthMm: 50.8, heightMm: 50.8 },
    { id: 'custom', name: 'Custom Size (mm)', widthMm: 35, heightMm: 45 }
  ];

  const bgColors = [
    { name: 'White', value: '#ffffff', class: 'bg-white border-slate-300' },
    { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500 border-blue-600' }
  ];

  // Resolve active dimension values
  const activePreset = presets.find((p) => p.id === selectedPreset);
  const currentWidthMm = selectedPreset === 'custom' ? customWidth : activePreset.widthMm;
  const currentHeightMm = selectedPreset === 'custom' ? customHeight : activePreset.heightMm;
  const aspect = currentWidthMm / currentHeightMm;

  // Resolve target compression value
  const targetCompressKb = compressPreset === 'custom' ? customCompressKb : parseInt(compressPreset);

  // Handle crop completion
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // helper to measure base64 string size in KB
  const getBase64SizeKb = (base64String) => {
    if (!base64String) return 0;
    const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
    const bytes = (base64String.length * 3) / 4 - padding;
    return parseFloat((bytes / 1024).toFixed(1));
  };

  // Perform binary search quality compression on a cropped Base64 image
  const compressCroppedImage = async (imageSrcUrl, targetKb) => {
    const img = new Image();
    img.src = imageSrcUrl;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    let minQuality = 0.05;
    let maxQuality = 0.98;
    let quality = 0.75;
    let iteration = 0;
    let bestBlob = null;

    const targetBytes = targetKb * 1024;

    while (iteration < 10) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });

      if (!blob) break;

      const size = blob.size;

      if (size <= targetBytes && (bestBlob === null || size > bestBlob.size)) {
        bestBlob = blob;
      }

      if (size > targetBytes) {
        maxQuality = quality;
        quality = (minQuality + quality) / 2;
      } else {
        minQuality = quality;
        quality = (maxQuality + quality) / 2;
      }

      iteration++;
    }

    if (!bestBlob) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      bestBlob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.1);
      });
    }

    return {
      url: URL.createObjectURL(bestBlob),
      sizeBytes: bestBlob.size,
      sizeKb: parseFloat((bestBlob.size / 1024).toFixed(1))
    };
  };

  // Update live preview and compress when parameters change
  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) return;

    const timeoutId = setTimeout(async () => {
      setGeneratingPreview(true);
      try {
        // Calculate resolution in pixels corresponding to the dimensions at 300 DPI (1 mm = 11.81 pixels)
        const targetSize = {
          width: Math.round(currentWidthMm * 11.81),
          height: Math.round(currentHeightMm * 11.81)
        };
        const cropped = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, bgColor, targetSize);
        setCroppedSizeKb(getBase64SizeKb(cropped));

        // Compress
        const compressed = await compressCroppedImage(cropped, targetCompressKb);
        setCompressedResult(compressed);
      } catch (e) {
        console.error(e);
      } finally {
        setGeneratingPreview(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [imageSrc, croppedAreaPixels, rotation, bgColor, currentWidthMm, currentHeightMm, targetCompressKb]);

  // Update A4 print sheet preview
  useEffect(() => {
    if (!compressedResult) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setGeneratingSheet(true);
      try {
        const canvas = await generatePrintSheetCanvas({
          imageSrc: compressedResult.url,
          photoWidthMm: currentWidthMm,
          photoHeightMm: currentHeightMm,
          layoutCount: sheetPhotosCount
        });
        sheetCanvasRef.current = canvas;
        setSheetPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));

        canvas.toBlob((blob) => {
          if (blob) {
            setSheetPngUrl(URL.createObjectURL(blob));
          }
        }, 'image/png');
      } catch (e) {
        console.error(e);
      } finally {
        setGeneratingSheet(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [compressedResult, sheetPhotosCount, currentWidthMm, currentHeightMm]);

  // Track previous compressed result URL to revoke it and prevent memory leaks
  const prevCompressedUrlRef = useRef(null);
  const prevSheetPngUrlRef = useRef(null);

  useEffect(() => {
    if (compressedResult?.url) {
      if (prevCompressedUrlRef.current && prevCompressedUrlRef.current !== compressedResult.url) {
        URL.revokeObjectURL(prevCompressedUrlRef.current);
      }
      prevCompressedUrlRef.current = compressedResult.url;
    } else {
      if (prevCompressedUrlRef.current) {
        URL.revokeObjectURL(prevCompressedUrlRef.current);
        prevCompressedUrlRef.current = null;
      }
    }
  }, [compressedResult]);

  useEffect(() => {
    if (sheetPngUrl) {
      if (prevSheetPngUrlRef.current && prevSheetPngUrlRef.current !== sheetPngUrl) {
        URL.revokeObjectURL(prevSheetPngUrlRef.current);
      }
      prevSheetPngUrlRef.current = sheetPngUrl;
    } else {
      if (prevSheetPngUrlRef.current) {
        URL.revokeObjectURL(prevSheetPngUrlRef.current);
        prevSheetPngUrlRef.current = null;
      }
    }
  }, [sheetPngUrl]);

  useEffect(() => {
    return () => {
      if (prevCompressedUrlRef.current) {
        URL.revokeObjectURL(prevCompressedUrlRef.current);
      }
      if (prevSheetPngUrlRef.current) {
        URL.revokeObjectURL(prevSheetPngUrlRef.current);
      }
    };
  }, []);

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('Could not read the selected image. Please try a different file.')));
    reader.readAsDataURL(file);
  });

  const validateAndProcessFile = async (file) => {
    setError(null);
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setError('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      setImageSrc(null);
      setCompressedResult(null);
      setSheetPreviewUrl(null);
      setSheetPngUrl(null);
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('The selected file is too large (above 12 MB). Please select an image under 12 MB to ensure fast client-side performance.');
      setImageSrc(null);
      setCompressedResult(null);
      setSheetPreviewUrl(null);
      setSheetPngUrl(null);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setImageSrc(dataUrl);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    try {
      await validateAndProcessFile(file);
    } catch (err) {
      setError(err.message);
      setImageSrc(null);
      setCompressedResult(null);
      setSheetPreviewUrl(null);
      setSheetPngUrl(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]).catch((err) => {
        setError(err.message);
        setImageSrc(null);
        setCompressedResult(null);
        setSheetPreviewUrl(null);
        setSheetPngUrl(null);
      });
    }
  };

  const resetCropper = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setBgColor('#ffffff');
    setSelectedPreset('35x45_mm');
    setCustomWidth(35);
    setCustomHeight(45);
    setCompressPreset('50');
    setCustomCompressKb(30);
    setSheetPhotosCount(6);
  };

  const removeImage = () => {
    setImageSrc(null);
    setCompressedResult(null);
    setSheetPreviewUrl(null);
    setSheetPngUrl(null);
    setError(null);
    resetCropper();
  };

  // Export helpers are handled natively via <a> elements now

  const downloadSheetPdf = () => {
    if (!sheetCanvasRef.current) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = sheetCanvasRef.current.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    pdf.save(`passport_sheet_${sheetPhotosCount}_photos.pdf`);
  };

  return (
    <>
      <SEO
        title="Passport Size Photo Maker Online Free | QuickTools"
        description="Use QuickTools passport size photo maker online free to crop, resize, and export printable passport photos directly in your browser. Private, fast, and no uploads required."
        pageName="Passport Size Photo Maker"
      />
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Page Header */}
		      <div className="space-y-3">
		        <h1 className="text-3xl font-extrabold text-slate-900">Passport Size Photo Maker</h1>
		        <p className="text-slate-600 text-sm leading-relaxed">
		          QuickTools passport size photo maker helps you create passport photos online for free. Upload a portrait, adjust the crop, choose a white or blue background, and export a printable photo sheet directly in your browser with no uploads.
		        </p>
		      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload / Cropper */}
	        <div className="lg:col-span-7 flex flex-col space-y-6">
	          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/60 shadow-sm flex-grow flex flex-col justify-between">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-start space-x-3 text-sm font-semibold transition-all duration-300">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!imageSrc ? (
              <label
                htmlFor={fileInputId}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
	                className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 group min-h-[320px] ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  id={fileInputId}
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.webp"
                  className="sr-only"
                  aria-label="Choose a passport photo"
                />
                <span className="inline-flex px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors duration-200 shadow-sm">
                  Choose Image
                </span>
                
                <div className="p-4 bg-slate-100 group-hover:bg-indigo-600 rounded-2xl text-slate-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <p className="text-base font-bold text-slate-800">
                    Drag and drop your image here, or <span className="text-indigo-600 hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Supports: JPG, JPEG, PNG, WEBP
                  </p>
                </div>
              </label>
            ) : (
              <div className="space-y-6">
	                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
	                  <div>
	                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
	                      Adjust Crop
	                    </span>
	                    <p className="text-sm text-slate-600 mt-1">Drag the photo into the frame and fine-tune it from the controls.</p>
	                  </div>
	                  <button
	                    onClick={removeImage}
	                    className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
	                  >
                    <X className="h-4 w-4" />
                    <span>Remove Photo</span>
                  </button>
                </div>

                {/* Cropper Container */}
	                <div className="relative border border-slate-200 bg-slate-100 rounded-3xl overflow-hidden h-[360px] sm:h-[460px] w-full shadow-inner">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    showGrid={true}
                    cropShape="rect"
                  />
                </div>

                <p className="text-[10px] text-slate-500 font-semibold text-center">
                  Drag photo within frame to align. The grid outline aligns chin, nose, and forehead.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Controls & Preview */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Maximize className="h-4 w-4 text-indigo-600" />
                <span>Photo Setup</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Step 1
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Size</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs font-bold transition-all cursor-pointer ${
                      selectedPreset === preset.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block leading-snug">{preset.label || 'Custom'}</span>
                    {preset.id !== 'custom' && (
                      <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                        {preset.helper}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/70">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Width mm</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Math.max(10, parseFloat(e.target.value) || 10))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Height mm</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Math.max(10, parseFloat(e.target.value) || 10))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-600" />
                Background
              </p>
              <div className="flex flex-wrap gap-2">
                {bgColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setBgColor(color.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      bgColor === color.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full border shadow-inner ${color.class}`}></span>
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-950">
              Output: <strong className="text-indigo-700">{currentWidthMm} x {currentHeightMm} mm</strong>
              <span className="text-indigo-700/70"> at 300 DPI</span>
            </div>

            <div className="border-t border-slate-200/70 pt-3">
              <button
                type="button"
                onClick={() => setAdvancedOpen((value) => !value)}
                className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  Advanced Options
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </button>

              {advancedOpen && (
                <div className="mt-3 space-y-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/70">
                  <p className="text-xs font-semibold text-slate-500">Target file size</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '20 KB', value: '20' },
                      { label: '50 KB', value: '50' },
                      { label: '100 KB', value: '100' },
                      { label: 'Custom', value: 'custom' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setCompressPreset(item.value)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                          compressPreset === item.value
                            ? 'border-indigo-600 bg-white text-indigo-700 ring-2 ring-indigo-600/15'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {compressPreset === 'custom' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Max</label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={customCompressKb}
                        onChange={(e) => setCustomCompressKb(Math.max(5, parseInt(e.target.value) || 5))}
                        className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-right text-indigo-600 font-extrabold text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-bold">KB</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <span>Adjust Crop</span>
              </h2>
              {imageSrc && (
                <button
                  onClick={resetCropper}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            {imageSrc ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Rotation</span>
                    <span>{rotation} deg</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-medium">Upload a portrait image to adjust crop and alignment.</p>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-base font-bold text-slate-900">Preview & Download</h2>
              {compressedResult && (
                <div className="text-[10px] font-bold text-slate-500">
                  Target: {targetCompressKb} KB
                </div>
              )}
            </div>

            <div className="flex items-center justify-center rounded-3xl bg-slate-50 border border-slate-200/70 min-h-[180px] p-5">
              {compressedResult ? (
                <div className="relative flex flex-col items-center">
                  <div
                    className="relative overflow-hidden bg-white flex items-center justify-center shadow-sm ring-1 ring-slate-200"
                    style={{
                      width: aspect >= 1 ? '140px' : `${140 * aspect}px`,
                      height: aspect <= 1 ? '182px' : `${182 / aspect}px`
                    }}
                  >
                    <img
                      src={compressedResult.url}
                      alt="Passport Live Preview"
                      className="w-full h-full object-cover"
                    />
                    {generatingPreview && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="bg-white p-3 rounded-full text-slate-400 border border-slate-200/80 shadow-sm inline-block">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <p className="text-slate-700 text-xs font-bold">Preview appears after upload</p>
                </div>
              )}
            </div>

            {compressedResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center text-xs">
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Original Crop</div>
                    <div className="font-bold text-slate-700">{croppedSizeKb} KB</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Download Size</div>
                    <div className="font-extrabold text-emerald-600">{compressedResult.sizeKb} KB</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-2 rounded-2xl border border-indigo-100/50">
                  <CheckCircle className="h-4 w-4 font-bold" />
                  <span>Ready for download</span>
                </div>

                <a
                  href={compressedResult.url}
                  download={`passport_${currentWidthMm}x${currentHeightMm}mm_max_${targetCompressKb}kb.jpg`}
                  className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 cursor-pointer text-center"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Photo</span>
                </a>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Printer className="h-4 w-4 text-indigo-600" />
              <span>Printable Sheet</span>
            </h2>

            {compressedResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 8].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSheetPhotosCount(count)}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer text-center ${
                        sheetPhotosCount === count
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/15'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {count}
                      <span className="ml-1 font-semibold">photos</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center rounded-3xl bg-slate-50 border border-slate-200/70 p-4 min-h-[170px]">
                  {sheetPreviewUrl ? (
                    <div className="relative border border-slate-200 shadow-sm bg-white w-28 aspect-[210/297] overflow-hidden">
                      <img
                        src={sheetPreviewUrl}
                        alt="Print A4 Layout Preview"
                        className="w-full h-full object-contain"
                      />
                      {generatingSheet && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs">Generating preview...</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={sheetPngUrl || '#'}
                    download={`passport_sheet_${sheetPhotosCount}_photos.png`}
                    className={`py-2.5 px-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-600 font-bold text-xs transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${!sheetPngUrl ? 'opacity-55 pointer-events-none' : ''}`}
                  >
                    <FileImage className="h-4 w-4 text-indigo-500" />
                    <span>PNG</span>
                  </a>

                  <button
                    onClick={downloadSheetPdf}
                    disabled={!sheetPreviewUrl}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-600 font-bold text-xs transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-medium">
                Create a cropped photo first, then export a print-ready A4 sheet.
              </p>
            )}
          </div>
        </div>

      </div>

	      <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
	        <div>
	          <h2 id="passport-overview" className="text-2xl font-bold text-slate-900">Online Passport Size Photo Maker</h2>
	          <p className="text-sm text-slate-600 leading-relaxed">
	            Create passport size photos for applications, forms, and printouts without installing software. QuickTools keeps the workflow simple: crop the face, choose the background, preview the result, then download a single photo or an A4 sheet.
	          </p>
	        </div>

	        <section aria-labelledby="passport-usage" className="space-y-4">
	          <h3 id="passport-usage" className="text-xl font-semibold text-slate-900">How to Use</h3>
	          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
	            <li>Upload a clear portrait photo in JPG, PNG, or WEBP format.</li>
	            <li>Adjust the crop, zoom, and rotation until the face fits the frame.</li>
	            <li>Choose a white or blue background.</li>
	            <li>Select a printable layout with 4, 6, or 8 photos.</li>
	            <li>Export the final passport photo as PNG or PDF.</li>
	          </ol>
	        </section>

	        <section aria-labelledby="passport-features" className="space-y-4">
	          <h3 id="passport-features" className="text-xl font-semibold text-slate-900">Features</h3>
	          <ul className="space-y-3 text-sm text-slate-600">
	            <li className="list-disc list-inside">Printable A4 passport photo sheets for home or shop printing.</li>
	            <li className="list-disc list-inside">White and blue background options for common passport and visa requirements.</li>
	            <li className="list-disc list-inside">PNG and PDF export for single photos and print layouts.</li>
	            <li className="list-disc list-inside">Browser-based processing with no server uploads.</li>
	            <li className="list-disc list-inside">Privacy-friendly workflow for personal identity photos.</li>
	          </ul>
	        </section>

	        <section aria-labelledby="passport-faq" className="space-y-4">
	          <h3 id="passport-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
	          <div className="space-y-4 text-sm text-slate-600">
	            <div>
	              <p className="font-semibold text-slate-900">Can I create passport size photos online for free?</p>
	              <p>Yes. QuickTools lets you create passport size photos online for free, including crop adjustment, background selection, and printable sheet export.</p>
	            </div>
	            <div>
	              <p className="font-semibold text-slate-900">Does QuickTools upload my images?</p>
	              <p>No. Your photo is processed locally in your browser, so it never needs to be uploaded to a server.</p>
	            </div>
	            <div>
	              <p className="font-semibold text-slate-900">What background color should I use?</p>
	              <p>White is the safest default for most passport and ID photos. Blue is available for requirements that specifically ask for a blue background.</p>
	            </div>
	            <div>
	              <p className="font-semibold text-slate-900">Can I print multiple passport photos on one sheet?</p>
	              <p>Yes. Use the printable sheet option to arrange multiple passport photos on an A4 layout and export it as PNG or PDF.</p>
	            </div>
	          </div>
	        </section>

	        <section aria-labelledby="passport-related" className="space-y-4">
	          <h3 id="passport-related" className="text-xl font-semibold text-slate-900">Related Tools</h3>
	          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm font-semibold">
	            <Link to="/resize-image" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-indigo-600 hover:bg-slate-50 transition">
	              Resize Image
	            </Link>
	            <Link to="/compress-image" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-indigo-600 hover:bg-slate-50 transition">
	              Compress Image
	            </Link>
	            <Link to="/signature-cropper" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-indigo-600 hover:bg-slate-50 transition">
	              Signature Cropper
	            </Link>
	            <Link to="/image-to-pdf" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-indigo-600 hover:bg-slate-50 transition">
	              Image to PDF
	            </Link>
	          </div>
	        </section>
	      </section>
      </div>
    </>
  );
}
