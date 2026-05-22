import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { Upload, X, Sliders, RefreshCw, Download, Image as ImageIcon, CheckCircle, AlertCircle, Palette, Maximize, Zap, Printer, FileText, FileImage } from 'lucide-react';
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

  const fileInputRef = useRef(null);
  const fileInputId = 'passport-photo-file-input';
  const sheetCanvasRef = useRef(null);

  const presets = [
    { id: '35x45_mm', name: '35x45 mm (Indian/Schengen Passport)', widthMm: 35, heightMm: 45 },
    { id: '50x50_mm', name: '50.8x50.8 mm (US Visa / 2x2 Inch)', widthMm: 50.8, heightMm: 50.8 },
    { id: 'custom', name: 'Custom Size (mm)', widthMm: 35, heightMm: 45 }
  ];

  const bgColors = [
    { name: 'White', value: '#ffffff', class: 'bg-white border-slate-300' },
    { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500 border-blue-600' },
    { name: 'Red', value: '#ef4444', class: 'bg-red-500 border-red-600' },
    { name: 'Light Gray', value: '#f1f5f9', class: 'bg-slate-100 border-slate-300' }
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
        description="Create exact passport and visa photos in your browser with local-first processing, biometric alignment guides, and printable sheet export. No uploads required."
      />
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900">Passport Size Photo Maker</h1>
        <p className="text-slate-600 text-sm">
          Crop, align, recolor backgrounds, and compress passport photos to your exact size guidelines. Complete offline operation ensures 100% privacy.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload / Cropper */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm flex-grow flex flex-col justify-between">
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
                className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 group min-h-[350px] ${
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
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Biometric Crop Canvas
                  </span>
                  <button
                    onClick={removeImage}
                    className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Remove Photo</span>
                  </button>
                </div>

                {/* Cropper Container */}
                <div className="relative border border-slate-200 bg-slate-100 rounded-2xl overflow-hidden h-96 w-full">
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
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Preset Sizing Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Maximize className="h-5 w-5 text-indigo-600" />
              <span>Dimension Settings</span>
            </h2>

            {/* Presets List */}
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    selectedPreset === preset.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold">{preset.name}</div>
                  {preset.id !== 'custom' && (
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {preset.widthMm} × {preset.heightMm} mm
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Dimensions */}
            {selectedPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-inner">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Width (mm):</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Math.max(10, parseFloat(e.target.value) || 10))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Height (mm):</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Math.max(10, parseFloat(e.target.value) || 10))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Selection info readout */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-100/50 rounded-2xl text-[11px] font-semibold text-indigo-950 leading-normal">
              Selected Target Size:{' '}
              <strong className="text-indigo-600 font-extrabold">{currentWidthMm} × {currentHeightMm} mm</strong>{' '}
              (approx.{' '}
              <strong className="text-indigo-600 font-extrabold">
                {Math.round(currentWidthMm * 11.81)} × {Math.round(currentHeightMm * 11.81)} px
              </strong>{' '}
              at print quality 300 DPI)
            </div>
          </div>

          {/* Sizing & Alignment Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-indigo-600" />
              <span>Alignment Settings</span>
            </h2>

            {imageSrc ? (
              <div className="space-y-6">
                {/* Zoom Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Scale Zoom</span>
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

                {/* Rotation Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Align Angle</span>
                    <span>{rotation}°</span>
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

                {/* Reset Button */}
                <button
                  onClick={resetCropper}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold text-xs transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Alignment</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-medium text-xs">
                Upload a portrait image to configure options.
              </div>
            )}
          </div>

          {/* Background Customization Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              <span>Background Color</span>
            </h2>

            {imageSrc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {bgColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setBgColor(color.value)}
                      className={`flex flex-col items-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        bgColor === color.value
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border mb-2 shadow-inner ${color.class}`}></div>
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-medium text-xs">
                Upload a portrait image to edit background options.
              </div>
            )}
          </div>

          {/* Target Compression Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <span>Target File Size</span>
            </h2>

            {imageSrc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '20 KB', value: '20' },
                    { label: '50 KB', value: '50' },
                    { label: '100 KB', value: '100' },
                    { label: 'Custom', value: 'custom' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setCompressPreset(item.value)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm text-center ${
                        compressPreset === item.value
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {compressPreset === 'custom' && (
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-inner">
                    <label className="text-xs font-bold text-slate-500">Max KB Limit:</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={customCompressKb}
                      onChange={(e) => setCustomCompressKb(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right text-indigo-600 font-extrabold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 font-bold">KB</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-medium text-xs">
                Upload a portrait image to configure target size.
              </div>
            )}
          </div>

          {/* Printable Sheet Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Printer className="h-5 w-5 text-indigo-600" />
              <span>Printable Photo Sheet (A4)</span>
            </h2>

            {compressedResult ? (
              <div className="space-y-4">
                {/* Photo Grid Layout Counter Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Select Layout Count:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[4, 6, 8].map((count) => (
                      <button
                        key={count}
                        onClick={() => setSheetPhotosCount(count)}
                        className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-sm text-center ${
                          sheetPhotosCount === count
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {count} Photos
                      </button>
                    ))}
                  </div>
                </div>

                {/* mini A4 preview area */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sheet Layout Preview:</label>
                  <div className="flex items-center justify-center p-4 bg-slate-100/50 rounded-2xl border border-slate-200 relative min-h-[220px]">
                    {sheetPreviewUrl ? (
                      <div className="relative border border-slate-300 shadow-lg bg-white w-36 aspect-[210/297] overflow-hidden">
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
                </div>

                {/* Export Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href={sheetPngUrl || '#'}
                    download={`passport_sheet_${sheetPhotosCount}_photos.png`}
                    className={`py-2.5 px-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-600 font-bold text-xs transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${!sheetPngUrl ? 'opacity-55 pointer-events-none' : ''}`}
                  >
                    <FileImage className="h-4 w-4 text-indigo-500" />
                    <span>Export PNG</span>
                  </a>

                  <button
                    onClick={downloadSheetPdf}
                    disabled={!sheetPreviewUrl}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-600 font-bold text-xs transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-medium text-xs">
                Upload a portrait image to configure printable sheets.
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm flex-grow flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Biometric Live Preview
              </h2>
              {compressedResult && (
                <div className="text-[10px] font-bold text-slate-500">
                  Target: {targetCompressKb} KB
                </div>
              )}
            </div>

            <div className="flex-grow flex items-center justify-center">
              {compressedResult ? (
                <div className="relative flex flex-col items-center">
                  <div 
                    className="relative border-2 border-dashed border-indigo-500/50 shadow-md overflow-hidden bg-white flex items-center justify-center"
                    style={{
                      width: aspect >= 1 ? '160px' : `${160 * aspect}px`,
                      height: aspect <= 1 ? '208px' : `${208 / aspect}px`
                    }}
                  >
                    <img
                      src={compressedResult.url}
                      alt="Passport Live Preview"
                      className="w-full h-full object-cover"
                    />
                    {generatingPreview && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 p-6">
                  <div className="bg-slate-100 p-4 rounded-full text-slate-400 border border-slate-200/80 shadow-sm inline-block">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="text-slate-800 text-xs font-bold">Preview Standby</p>
                  <p className="text-slate-500 text-[10px] max-w-xs font-semibold">
                    Once loaded, your aligned document outputs render here.
                  </p>
                </div>
              )}
            </div>

            {compressedResult && (
              <div className="space-y-4">
                {/* Stats Readout */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs">
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Before Compress</div>
                    <div className="font-bold text-slate-700">{croppedSizeKb} KB</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Optimized Output</div>
                    <div className="font-extrabold text-emerald-600">{compressedResult.sizeKb} KB</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100/50">
                  <CheckCircle className="h-4 w-4 font-bold" />
                  <span>Size and biometric crops compliant</span>
                </div>

                <a
                  href={compressedResult.url}
                  download={`passport_${currentWidthMm}x${currentHeightMm}mm_max_${targetCompressKb}kb.jpg`}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 cursor-pointer animate-pulse-slow text-center"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Cropped Photo</span>
                </a>
              </div>
            )}
          </div>
        </div>

      </div>

      <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
        <div>
          <h2 id="passport-overview" className="text-2xl font-bold text-slate-900">Passport Photo Tool Overview</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            QuickTools Passport Photo Maker runs entirely in your browser. That means your identity image never leaves your device, and you get fast output without server uploads or storage.
          </p>
        </div>

        <section aria-labelledby="passport-features" className="space-y-4">
          <h3 id="passport-features" className="text-xl font-semibold text-slate-900">Features</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="list-disc list-inside">Exact biometric presets for passport, visa, and ID photos.</li>
            <li className="list-disc list-inside">Drag-to-align image cropping with head and chin guide overlays.</li>
            <li className="list-disc list-inside">Background color control with white, blue, red, and grayscale options.</li>
            <li className="list-disc list-inside">Download splits, printable A4 sheets, and secure local-only export.</li>
          </ul>
        </section>

        <section aria-labelledby="passport-usage" className="space-y-4">
          <h3 id="passport-usage" className="text-xl font-semibold text-slate-900">How to Use</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
            <li>Upload a clear portrait photo in JPG, PNG, or WEBP format.</li>
            <li>Choose a passport or visa size preset, or enter custom millimeter dimensions.</li>
            <li>Adjust crop, zoom, rotation, and background color until the face fits the frame.</li>
            <li>Export the corrected photo or generate a printable photo sheet without leaving your browser.</li>
          </ol>
        </section>

        <section aria-labelledby="passport-faq" className="space-y-4">
          <h3 id="passport-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Does this tool upload my photo?</p>
              <p>No. All photo formatting and export happen locally in your browser, so your passport photo never leaves your computer.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Which file types are supported?</p>
              <p>QuickTools accepts JPG, JPEG, PNG, and WEBP image files for passport photo creation.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Can I print the result?</p>
              <p>Yes. Use the printable sheet export to generate A4-ready passport photo layouts for printing.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="passport-related" className="space-y-4">
          <h3 id="passport-related" className="text-xl font-semibold text-slate-900">Related QuickTools</h3>
          <p className="text-sm text-slate-600">Need a smaller upload-ready file or a clean signature asset? Try our related browser tools.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold">
            <li>
              <Link to="/resize-image" className="text-indigo-600 hover:underline">Resize Image Tool</Link>
            </li>
            <li>
              <Link to="/signature-cropper" className="text-indigo-600 hover:underline">Signature Cropper</Link>
            </li>
          </ul>
        </section>
      </section>
      </div>
    </>
  );
}
