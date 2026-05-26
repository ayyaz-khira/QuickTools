import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Image as ImageIcon, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import SEO from '../components/SEO';

const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const getExtension = (fileName) => {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

const supportsImageFile = (file) => {
  if (!file) return false;
  const ext = getExtension(file.name);
  return SUPPORTED_EXTENSIONS.includes(ext) || file.type.startsWith('image/');
};

const checkerboardStyle = {
  backgroundImage:
    'linear-gradient(45deg, rgba(148, 163, 184, 0.25) 25%, transparent 25%), linear-gradient(-45deg, rgba(148, 163, 184, 0.25) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.25) 75%), linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.25) 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
};

export default function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [backgroundMode, setBackgroundMode] = useState('transparent');
  const [status, setStatus] = useState('Upload an image to start.');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  const fileInputRef = useRef(null);
  const backgroundRemovalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [originalUrl, resultUrl]);

  const resetAll = () => {
    setSelectedFile(null);
    setOriginalUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setResultUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setBackgroundMode('transparent');
    setStatus('Upload an image to start.');
    setError(null);
  };

  const validateFile = (file) => {
    setError(null);
    if (!file) {
      setError('No file selected.');
      return false;
    }
    if (!supportsImageFile(file)) {
      setError('Unsupported image type. Upload JPG, PNG, or WEBP.');
      return false;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Please use an image smaller than 15 MB for best browser performance.');
      return false;
    }
    return true;
  };

  const loadBackgroundRemovalLibrary = async () => {
    if (backgroundRemovalRef.current) return backgroundRemovalRef.current;
    setIsLoadingLibrary(true);
    setStatus('Loading background removal engine...');

    try {
      const module = await import('@imgly/background-removal');
      const remover = module.removeBackground || module.default || module;
      if (typeof remover !== 'function') {
        throw new Error('Background removal export is not a function.');
      }
      backgroundRemovalRef.current = remover;
      setLibraryLoaded(true);
      return remover;
    } catch (err) {
      console.error(err);
      setError('Could not load the background removal engine. Please refresh and try again.');
      throw err;
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleFileSelection = async (file) => {
    if (!validateFile(file)) return;

    setError(null);
    setStatus('Preparing your image...');
    setResultUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setOriginalUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    setStatus('Ready to remove background.');
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    handleFileSelection(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelection(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const removeBackground = async () => {
    if (!selectedFile) {
      setError('Please upload an image first.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setStatus('Removing background...');
    setResultUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    try {
      const remover = await loadBackgroundRemovalLibrary();
      const config = {
        debug: false,
        device: 'gpu',
        model: 'isnet_fp16',
        output: {
          type: 'foreground',
          format: 'image/png',
          quality: 0.9,
        },
        progress: (key, current, total) => {
          if (key === 'model') {
            setStatus(`Downloading AI model (${current}/${total})...`);
          } else if (key === 'wasm') {
            setStatus(`Downloading WebAssembly runtime (${current}/${total})...`);
          } else {
            setStatus('Removing background...');
          }
        },
      };

      const blob = await remover(selectedFile, config);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus('Background removed successfully.');
    } catch (err) {
      console.error(err);
      setError('Background removal failed. Try a different image or refresh the page.');
      setStatus('Upload an image to start.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const anchor = document.createElement('a');
    anchor.href = resultUrl;
    anchor.download = `${selectedFile?.name.replace(/\.[^.]+$/, '')}-transparent.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const getPreviewBackground = () => {
    if (backgroundMode === 'white') return 'bg-white';
    if (backgroundMode === 'blue') return 'bg-sky-200';
    return 'bg-transparent';
  };

  return (
    <>
      <SEO
        title="Background Remover Online Free | QuickTools"
        description="Remove image backgrounds online for free with AI-powered background removal. Download transparent PNG images instantly in your browser."
      />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">Remove Image Backgrounds Online Free</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Upload a JPG, PNG or WEBP image and let AI remove the background. Download a transparent PNG instantly in your browser with no uploads.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">Upload Image</p>
              <p className="text-sm text-slate-500">Select or drag and drop a JPG, PNG, or WEBP image.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Select Image
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileInput}
          />

          <div
            className={`rounded-3xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-white'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <p className="text-sm text-slate-500">Drag and drop images here, or click the button to choose files.</p>
            <p className="mt-2 text-xs text-slate-400">Supported: JPG, JPEG, PNG, WEBP. Max 15 MB per image.</p>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{status}</p>
                <p className="text-xs text-slate-400">{selectedFile ? `${selectedFile.name} - ${(selectedFile.size / 1024).toFixed(1)} KB` : 'No image selected'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  onClick={resetAll}
                  disabled={!selectedFile}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={removeBackground}
                  disabled={!selectedFile || isProcessing || isLoadingLibrary}
                >
                  <ImageIcon className="h-4 w-4" />
                  {isProcessing || isLoadingLibrary ? 'Processing...' : 'Remove Background'}
                </button>
              </div>
            </div>

            {(originalUrl || resultUrl) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Original</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-100 overflow-hidden">
                    {originalUrl ? (
                      <img src={originalUrl} alt="Original upload" className="w-full object-contain" />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-slate-400">No image</div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Result</p>
                  <div className={`relative rounded-3xl border border-slate-200 overflow-hidden ${
                    backgroundMode === 'transparent' ? 'p-2' : ''
                  }`} style={backgroundMode === 'transparent' ? { ...checkerboardStyle, borderRadius: '1.5rem' } : { backgroundColor: backgroundMode === 'white' ? 'white' : '#bfdbfe' }}>
                    {resultUrl ? (
                      <img src={resultUrl} alt="Background removed" className="w-full object-contain" />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-slate-400">Result appears here</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {resultUrl && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={downloadResult}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                    Download PNG
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-2">
                    <button
                      type="button"
                      onClick={() => setBackgroundMode('transparent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        backgroundMode === 'transparent' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Transparent
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackgroundMode('white')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        backgroundMode === 'white' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      White
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackgroundMode('blue')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        backgroundMode === 'blue' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Blue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Features</h2>
            <ul className="space-y-3 text-sm text-slate-600 mt-4">
              <li className="list-disc list-inside">AI-powered background removal with precise foreground edge detection.</li>
              <li className="list-disc list-inside">Download transparent PNG images instantly with no uploads.</li>
              <li className="list-disc list-inside">Preview backgrounds in transparent, white, or blue modes.</li>
              <li className="list-disc list-inside">All processing happens locally in your browser for complete privacy.</li>
            </ul>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">How to Use</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
              <li>Upload a JPG, PNG, or WEBP image using the picker or drag-and-drop area.</li>
              <li>Click "Remove Background" to process your image with AI segmentation.</li>
              <li>Preview the result and choose a background mode (transparent, white, or blue).</li>
              <li>Download the transparent PNG directly to your device.</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">FAQ</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Will my image be uploaded?</p>
                <p>No. Background removal happens entirely inside your browser. Your image never leaves your device.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">What types of images can I use?</p>
                <p>QuickTools supports JPG, JPEG, PNG, and WEBP image formats. For best results, use images with clear subject separation.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Why is the first run slower?</p>
                <p>The first run downloads and caches the AI model and WebAssembly runtime. Subsequent runs are much faster.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Can I use this on mobile?</p>
                <p>Yes, though smaller images work best on mobile devices. Performance depends on your device capabilities.</p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
