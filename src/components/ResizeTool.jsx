import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Image as ImageIcon, Sliders, RefreshCw, AlertCircle, Zap, X } from 'lucide-react';
import { isSupportedImageFile } from '../utils/fileValidation';

export default function ResizeTool({ mode = 'resize', defaultTargetKb = 50, defaultQuality = 0.75 }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [targetKb, setTargetKb] = useState(defaultTargetKb);
  const [quality, setQuality] = useState(defaultQuality);
  const [compressing, setCompressing] = useState(false);
  const [compressedResult, setCompressedResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const fileInputId = 'resize-image-file-input';

  useEffect(() => {
    setTargetKb(defaultTargetKb);
  }, [defaultTargetKb]);

  useEffect(() => {
    setQuality(defaultQuality);
  }, [defaultQuality]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true') {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAExJREFUeNrs0UENAAAMwzCdff9O7+ACWshkpqoCDmRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGQcDgEGAM5KAAHO4G9kAAAAAElFTkSuQmCC';
      fetch(mockBase64)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'mock_image.png', { type: 'image/png' });
          setSelectedFile(file);
          setPreviewUrl(mockBase64);
        });
    }
  }, []);

  const prevPreviewUrlRef = useRef(null);
  const prevCompressedUrlRef = useRef(null);

  useEffect(() => {
    if (previewUrl) {
      if (prevPreviewUrlRef.current && prevPreviewUrlRef.current !== previewUrl) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
      prevPreviewUrlRef.current = previewUrl;
    } else if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current);
      prevPreviewUrlRef.current = null;
    }
  }, [previewUrl]);

  useEffect(() => {
    if (compressedResult?.url) {
      if (prevCompressedUrlRef.current && prevCompressedUrlRef.current !== compressedResult.url) {
        URL.revokeObjectURL(prevCompressedUrlRef.current);
      }
      prevCompressedUrlRef.current = compressedResult.url;
    } else if (prevCompressedUrlRef.current) {
      URL.revokeObjectURL(prevCompressedUrlRef.current);
      prevCompressedUrlRef.current = null;
    }
  }, [compressedResult]);

  useEffect(() => {
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
      if (prevCompressedUrlRef.current) {
        URL.revokeObjectURL(prevCompressedUrlRef.current);
      }
    };
  }, []);

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setError('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setCompressedResult(null);
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('The selected file is too large (above 12 MB). Please select an image under 12 MB to ensure fast client-side performance.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setCompressedResult(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setCompressedResult(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    try {
      validateAndProcessFile(file);
    } catch (err) {
      setError(`Could not load selected image: ${err.message}`);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCompressedResult(null);
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
    const file = e.dataTransfer.files[0];
    validateAndProcessFile(file);
  };

  async function compressImage(file, targetKbValue, qualityValue = 0.75) {
    setCompressing(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => {
      setError('Could not read the selected image. Please try a different file.');
      setCompressing(false);
    };
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onerror = () => {
        setError('Could not load the selected image. Please try a different JPG, PNG, or WEBP file.');
        setCompressing(false);
      };
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let bestBlob = null;
          let bestSize = Infinity;
          let bestQuality = qualityValue;
          let bestScale = 1.0;

          if (mode === 'compress') {
            const blob = await new Promise((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/jpeg', qualityValue);
            });

            if (!blob) {
              throw new Error('Compression failed.');
            }

            bestBlob = blob;
            bestSize = blob.size;
          } else {
            const targetBytes = targetKbValue * 1024;
            let minQuality = 0.05;
            let maxQuality = 0.98;
            let qualitySearch = 0.75;
            let scale = 1.0;
            let iteration = 0;

            while (iteration < 12) {
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const blob = await new Promise((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', qualitySearch);
              });

              if (!blob) break;

              const size = blob.size;

              if (size <= targetBytes && (bestBlob === null || size > bestBlob.size)) {
                bestBlob = blob;
                bestSize = size;
                bestQuality = qualitySearch;
                bestScale = scale;
              }

              if (size > targetBytes) {
                if (qualitySearch > 0.15) {
                  maxQuality = qualitySearch;
                  qualitySearch = (minQuality + qualitySearch) / 2;
                } else {
                  scale *= 0.85;
                  minQuality = 0.05;
                  maxQuality = 0.95;
                  qualitySearch = 0.6;
                }
              } else {
                minQuality = qualitySearch;
                qualitySearch = (maxQuality + qualitySearch) / 2;
              }

              iteration++;
            }

            if (!bestBlob) {
              canvas.width = img.width * 0.4;
              canvas.height = img.height * 0.4;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              bestBlob = await new Promise((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.1);
              });
              bestSize = bestBlob.size;
              bestQuality = 0.1;
              bestScale = 0.4;
            }
          }

          const resultUrl = URL.createObjectURL(bestBlob);
          setCompressedResult({
            url: resultUrl,
            sizeBytes: bestSize,
            sizeKb: parseFloat((bestSize / 1024).toFixed(1)),
            quality: bestQuality,
            scale: bestScale,
            width: Math.round(img.width * bestScale),
            height: Math.round(img.height * bestScale),
          });

          if (mode !== 'compress' && bestSize > targetKbValue * 1024) {
            setError(`Could not compress fully below ${targetKbValue} KB without excessive quality loss. Best output is ${(bestSize / 1024).toFixed(1)} KB.`);
          }
        } catch (err) {
          console.error(err);
          setError('An error occurred during compression.');
        } finally {
          setCompressing(false);
        }
      };
    };
  }

  useEffect(() => {
    if (!selectedFile) return;

    const delayDebounceFn = setTimeout(() => {
      if (mode === 'compress') {
        compressImage(selectedFile, targetKb, quality);
      } else {
        compressImage(selectedFile, targetKb);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedFile, targetKb, quality, mode]);

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCompressedResult(null);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <span>Compression Settings</span>
          </h2>

          <div className="space-y-3">
            {mode === 'compress' ? (
              <>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700 font-bold">Quality Setting:</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-indigo-600 font-extrabold">{Math.round(quality * 100)}%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="text-xs text-slate-500">
                  Adjust quality to compress images while maintaining the best possible visual result.
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700 font-bold">Target Size Limit:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={targetKb}
                      onChange={(e) => setTargetKb(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-right text-indigo-600 font-extrabold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-sm text-slate-400 font-bold">KB</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={targetKb}
                  onChange={(e) => setTargetKb(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Min: 10 KB</span>
                  <span>Max: 500 KB</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Size Presets:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[20, 50, 100, 200].map((size) => (
                      <button
                        key={size}
                        onClick={() => setTargetKb(size)}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm text-center ${
                          targetKb === size
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {size} KB
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-700 font-bold">Upload Image:</label>
            <label
              htmlFor={fileInputId}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 group ${
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
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Choose an image"
              />
              <span className="inline-flex px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors duration-200 shadow-sm">
                Choose Image
              </span>

              <div className="p-3 bg-slate-100 group-hover:bg-indigo-600 rounded-xl text-slate-500 group-hover:text-white transition-all duration-300">
                <Upload className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Select or drag an image'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WebP
                </p>
              </div>

              {selectedFile && (
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold border border-slate-200/80">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              )}
            </label>
          </div>

          {selectedFile && (
            <button
              onClick={resetAll}
              className="w-full py-2.5 px-4 rounded-xl border border-red-200 hover:border-red-300 bg-white hover:bg-red-50/20 text-red-600 font-bold text-xs transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Remove Image</span>
            </button>
          )}

          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-start space-x-2 text-xs text-indigo-800 font-semibold leading-relaxed">
            <Zap className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Offline Processing: Images are compressed entirely inside your web browser. No server uploads occur.
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col">
        {previewUrl ? (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 flex-grow flex flex-col justify-between space-y-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Original Image</span>
                  <span className="text-slate-600 font-bold">
                    {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                  </span>
                </div>
                <div className="relative border border-slate-200 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 h-64 sm:h-80">
                  <img
                    src={previewUrl}
                    alt="Original source"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>{mode === 'compress' ? 'Quality' : `Target: ${targetKb} KB`}</span>
                  {compressedResult ? (
                    <span className={`font-extrabold ${mode === 'compress' ? 'text-emerald-600' : parseInt(compressedResult.sizeKb) <= targetKb ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {mode === 'compress' ? `${Math.round(quality * 100)}%` : `${compressedResult.sizeKb} KB`}
                    </span>
                  ) : (
                    <span>{mode === 'compress' ? `${Math.round(quality * 100)}%` : '-- KB'}</span>
                  )}
                </div>

                <div className="relative border border-slate-200 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 h-64 sm:h-80">
                  {compressing ? (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center space-y-3 z-10">
                      <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                      <span className="text-xs text-indigo-600 font-bold tracking-wide uppercase">Optimizing Pixels...</span>
                    </div>
                  ) : null}

                  {compressedResult ? (
                    <img
                      src={compressedResult.url}
                      alt="Compressed output"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center space-y-2 font-semibold">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                      <span>Optimizing results...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {compressedResult && (
              <div className="bg-slate-100/50 border border-slate-200 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">New Resolution</div>
                    <div className="text-sm font-bold text-slate-800">
                      {compressedResult.width} × {compressedResult.height} px
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Quality Level</div>
                    <div className="text-sm font-bold text-slate-800">
                      {Math.round(compressedResult.quality * 100)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Reduction Ratio</div>
                    <div className="text-sm font-extrabold text-emerald-600">
                      {selectedFile ? ((1 - compressedResult.sizeBytes / selectedFile.size) * 100).toFixed(0) : 0}% smaller
                    </div>
                  </div>
                </div>

                <a
                  href={compressedResult.url}
                  download={
                    mode === 'compress'
                      ? `compressed_${Math.round(quality * 100)}pct_${selectedFile.name.split('.')[0]}.jpg`
                      : `resized_${targetKb}kb_${selectedFile.name.split('.')[0]}.jpg`
                  }
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors duration-200 flex items-center space-x-2 shadow-lg shadow-emerald-600/10 cursor-pointer text-center"
                >
                  <Download className="h-4 w-4" />
                  <span>{mode === 'compress' ? 'Download Compressed JPG' : 'Download Resized JPG'}</span>
                </a>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start space-x-2 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel border-dashed border-slate-300 hover:border-slate-400 rounded-3xl p-12 text-center h-full flex flex-col justify-center items-center space-y-4 shadow-sm min-h-[300px]">
            <div className="bg-white p-4 rounded-full text-slate-400 border border-slate-200/80 shadow-sm">
              <ImageIcon className="h-10 w-10" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-slate-800 text-sm font-bold">No Image Uploaded</p>
              <p className="text-slate-500 text-xs font-semibold">
                Upload an image on the left, select your file limit, and we'll instantly optimize it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
