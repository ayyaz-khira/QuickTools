import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { Upload, Download, Sliders, RefreshCw, X, Palette, Eye, AlertCircle, ShieldCheck } from 'lucide-react';
import { getCleanedSignatureImg } from '../utils/cropImage';
import SEO from '../components/SEO';
import { isSupportedImageFile } from '../utils/fileValidation';

export default function SignatureCropper() {
  const testImageSrc = new URLSearchParams(window.location.search).get('test') === 'true'
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAExJREFUeNrs0UENAAAMwzCdff9O7+ACWshkpqoCDmRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGQcDgEGAM5KAAHO4G9kAAAAAElFTkSuQmCC'
    : null;
  const [imageSrc, setImageSrc] = useState(testImageSrc);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('3:1'); // '3:1', '4:1', '2:1'
  const [brightness, setBrightness] = useState(20);
  const [contrast, setContrast] = useState(40);
  const [threshold, setThreshold] = useState(140);
  const [inkColor, setInkColor] = useState('original'); // 'original', 'black', 'blue'
  const [transparentBg, setTransparentBg] = useState(false);
  
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cleanedSignatureUrl, setCleanedSignatureUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const fileInputId = 'signature-file-input';

  // Resolve aspect multiplier
  const getAspectValue = () => {
    if (aspectRatio === '4:1') return 4;
    if (aspectRatio === '2:1') return 2;
    return 3;
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Generate cleaned signature preview on changes
  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) return;

    const timeoutId = setTimeout(async () => {
      setGenerating(true);
      try {
        const cleaned = await getCleanedSignatureImg(
          imageSrc,
          croppedAreaPixels,
          rotation,
          brightness,
          contrast,
          threshold,
          inkColor,
          transparentBg
        );
        setCleanedSignatureUrl(cleaned);
      } catch (e) {
        console.error(e);
      } finally {
        setGenerating(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [imageSrc, croppedAreaPixels, rotation, brightness, contrast, threshold, inkColor, transparentBg]);

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
      setCleanedSignatureUrl(null);
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('The selected file is too large (above 12 MB). Please select an image under 12 MB to ensure fast client-side performance.');
      setImageSrc(null);
      setCleanedSignatureUrl(null);
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
      setCleanedSignatureUrl(null);
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
        setCleanedSignatureUrl(null);
      });
    }
  };

  const resetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectRatio('3:1');
    setBrightness(20);
    setContrast(40);
    setThreshold(140);
    setInkColor('original');
    setTransparentBg(false);
  };

  const removeImage = () => {
    setImageSrc(null);
    setCleanedSignatureUrl(null);
    setError(null);
    resetAll();
  };

  // downloadSignature is handled natively via <a> element now

  return (
    <>
      <SEO
        title="Signature Cropper Online Free | QuickTools"
        description="Crop and clean handwritten signatures locally in your browser with adjustable threshold, contrast, and transparent PNG export. Privacy-first and no server upload."
      />
      <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900">Signature Cropper & Cleaner</h1>
        <p className="text-slate-600 text-sm">
          Extract handwritten signatures from photos or scanned paper. Remove shadows, adjust ink levels, whiten paper backdrops, or save as a transparent PNG.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Easy Crop Area */}
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
                  aria-label="Choose a signature image"
                />
                <span className="inline-flex px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors duration-200 shadow-sm">
                  Choose Image
                </span>
                
                <div className="p-4 bg-slate-100 group-hover:bg-indigo-600 rounded-2xl text-slate-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <p className="text-base font-bold text-slate-800">
                    Drag and drop your signature scan here, or <span className="text-indigo-600 hover:underline">browse</span>
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
                    Crop Area Selection
                  </span>
                  <button
                    onClick={removeImage}
                    className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Remove File</span>
                  </button>
                </div>

                {/* Cropper Container */}
                <div className="relative border border-slate-200 bg-slate-100 rounded-2xl overflow-hidden h-96 w-full">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={getAspectValue()}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    showGrid={true}
                    cropShape="rect"
                  />
                </div>

                <p className="text-[10px] text-slate-500 font-semibold text-center">
                  Reposition the signature scanner outline box to frame your ink lines perfectly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clean controls & export */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Sizing presets and crop settings */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-indigo-600" />
              <span>Clean & Crop Controls</span>
            </h2>

            {imageSrc ? (
              <div className="space-y-4">
                {/* Crop Layout Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['3:1', '4:1', '2:1'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all border shadow-sm cursor-pointer ${
                          aspectRatio === ratio
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-600/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ink Color Adjust */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ink Style Extraction:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'original', name: 'Original' },
                      { id: 'black', name: 'Monochrome' },
                      { id: 'blue', name: 'Clean Blue' },
                    ].map((colorOpt) => (
                      <button
                        key={colorOpt.id}
                        onClick={() => setInkColor(colorOpt.id)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all border shadow-sm cursor-pointer ${
                          inkColor === colorOpt.id
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-600/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        {colorOpt.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-medium text-xs">
                Upload a signature to activate ratios and style settings.
              </div>
            )}
          </div>

          {/* Filter tuning sliders */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              <span>Image Enhancements</span>
            </h2>

            {imageSrc ? (
              <div className="space-y-6">
                {/* Scale Zoom */}
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

                {/* Angle */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Align Angle</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Brightness Boost</span>
                    <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="80"
                    step="5"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Contrast Strength</span>
                    <span>{contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Paper threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span>Paper Removal Threshold</span>
                    <span>{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="220"
                    step="5"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Transparency Switch */}
                <label className="flex items-center space-x-3 cursor-pointer group pt-2 select-none">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-extrabold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      Transparent Signature Background
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5 font-bold">
                      Exports signature as PNG transparency grid instead of solid white.
                    </p>
                  </div>
                </label>

                {/* Reset Alignment */}
                <button
                  onClick={resetAll}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold text-xs transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Alignment</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-medium text-xs">
                Upload a signature to customize thresholds and sliders.
              </div>
            )}
          </div>

          {/* Cleaned Signature Live Preview */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 shadow-sm flex-grow flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Signature Live Preview
              </h2>
            </div>

            <div className="flex-grow flex items-center justify-center min-h-[160px] p-4 bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden">
              
              {/* Checkered pattern background for transparency preview */}
              {transparentBg && (
                <div
                  className="absolute inset-0 z-0 opacity-15"
                  style={{
                    backgroundImage: 'radial-gradient(#ffffff 20%, transparent 20%), radial-gradient(#ffffff 20%, transparent 20%)',
                    backgroundPosition: '0 0, 8px 8px',
                    backgroundSize: '16px 16px',
                  }}
                ></div>
              )}

              {cleanedSignatureUrl ? (
                <div className="relative z-10 w-full flex items-center justify-center">
                  <img
                    src={cleanedSignatureUrl}
                    alt="Cleaned Signature Preview"
                    className="max-h-28 object-contain border border-slate-300/40 bg-white shadow-sm"
                  />
                  {generating && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-2 p-6 z-10">
                  <div className="bg-slate-100 p-4 rounded-full text-slate-400 border border-slate-200/80 shadow-sm inline-block">
                    <Eye className="h-6 w-6" />
                  </div>
                  <p className="text-slate-800 text-xs font-bold">Preview Standby</p>
                  <p className="text-slate-500 text-[10px] max-w-xs font-semibold">
                    Once loaded, your cleaned signature rendering outputs display here.
                  </p>
                </div>
              )}
            </div>

            {cleanedSignatureUrl && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100/50">
                  <ShieldCheck className="h-4 w-4 font-bold" />
                  <span>Signature binarization and cleaning complete</span>
                </div>

                <a
                  href={cleanedSignatureUrl}
                  download={`signature_${transparentBg ? 'transparent' : 'white'}.${transparentBg ? 'png' : 'jpg'}`}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 cursor-pointer text-center"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Signature ({transparentBg ? 'PNG' : 'JPG'})</span>
                </a>
              </div>
            )}
          </div>
        </div>

      </div>

      <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
        <div>
          <h2 id="signature-overview" className="text-2xl font-bold text-slate-900">Signature Cropper Overview</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Signature Cropper cleans up scanned handwriting in the browser. It preserves your privacy by keeping the image processing local and provides transparent PNG export for digital forms.
          </p>
        </div>

        <section aria-labelledby="signature-features" className="space-y-4">
          <h3 id="signature-features" className="text-xl font-semibold text-slate-900">Features</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="list-disc list-inside">Interactive signature cropping with adjustable transparency output.</li>
            <li className="list-disc list-inside">Brightness, contrast, and threshold controls for clean text extraction.</li>
            <li className="list-disc list-inside">Download cleaned signature as transparent PNG or white-background JPG.</li>
            <li className="list-disc list-inside">Local browser processing with no image uploads.</li>
          </ul>
        </section>

        <section aria-labelledby="signature-usage" className="space-y-4">
          <h3 id="signature-usage" className="text-xl font-semibold text-slate-900">How to Use</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
            <li>Choose a scanned signature image in JPG, PNG, or WEBP format.</li>
            <li>Use the crop box to isolate the signature area and adjust the zoom.</li>
            <li>Tune brightness, contrast, and threshold for optimal ink clarity.</li>
            <li>Export the result as a transparent PNG or white-background JPG directly from your browser.</li>
          </ol>
        </section>

        <section aria-labelledby="signature-faq" className="space-y-4">
          <h3 id="signature-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Is my signature uploaded anywhere?</p>
              <p>No. Signature cleaning and cropping happen entirely on your device in the browser.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Can I get a transparent background?</p>
              <p>Yes. Enable transparent background mode and download the cleaned signature as PNG.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">What if the image is dark or noisy?</p>
              <p>Use the brightness, contrast, and threshold sliders to improve contrast before export.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="signature-related" className="space-y-4">
          <h3 id="signature-related" className="text-xl font-semibold text-slate-900">Related QuickTools</h3>
          <p className="text-sm text-slate-600">For passport photo formatting or precise file-size compression, use our other locally-run utility pages.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold">
            <li>
                <Link to="/passport-photo" className="text-indigo-600 hover:underline">Passport Size Photo Maker</Link>
            </li>
            <li>
              <Link to="/resize-image" className="text-indigo-600 hover:underline">Resize Image Tool</Link>
            </li>
          </ul>
        </section>
      </section>
      </div>
    </>
  );
}
