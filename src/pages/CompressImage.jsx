import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ResizeTool from '../components/ResizeTool';

export default function CompressImage() {
  return (
    <>
      <SEO
        title="Compress Image Online Free | QuickTools"
        description="Compress JPG, PNG, and WEBP images online for free. Reduce image size instantly in your browser with no uploads."
      />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">Compress Image Online Free</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Compress JPG, PNG, and WEBP images in your browser without sending files to a server. Keep your photos private while reducing file size for uploads, messaging, and storage.
          </p>
        </div>

        <ResizeTool mode="compress" defaultQuality={0.75} />

        <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
          <div>
            <h2 id="compress-features" className="text-2xl font-bold text-slate-900">Features</h2>
            <ul className="space-y-3 text-sm text-slate-600 mt-4">
              <li className="list-disc list-inside">Client-side image compression for JPG, PNG, and WEBP with no uploads.</li>
              <li className="list-disc list-inside">Quality slider lets you tune compression level and image fidelity.</li>
              <li className="list-disc list-inside">Instant preview shows original and compressed output side by side.</li>
              <li className="list-disc list-inside">Download optimized JPG files directly after compression.</li>
            </ul>
          </div>

          <section aria-labelledby="compress-usage" className="space-y-4">
            <h3 id="compress-usage" className="text-xl font-semibold text-slate-900">How to Use</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
              <li>Upload a JPG, PNG, or WEBP image using the picker or drag-and-drop area.</li>
              <li>Adjust the quality slider to control how much the file should be compressed.</li>
              <li>Watch the compressed preview and output size update automatically.</li>
              <li>Download the compressed image once you’re happy with the result.</li>
            </ol>
          </section>

          <section aria-labelledby="compress-faq" className="space-y-4">
            <h3 id="compress-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Will my image be uploaded?</p>
                <p>No. Compression happens entirely inside your browser. Your image never leaves your device.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">What types of images can I compress?</p>
                <p>QuickTools supports JPG, JPEG, PNG, and WEBP image formats for browser compression.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Can I still use resize options?</p>
                <p>Yes. Use the Resize Image tool for exact KB targeting if you need a specific file size.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="compress-related" className="space-y-4">
            <h3 id="compress-related" className="text-xl font-semibold text-slate-900">Related QuickTools</h3>
            <p className="text-sm text-slate-600">Explore more image utilities built for privacy-first browser processing.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold">
              <li>
                <Link to="/resize-image" className="text-indigo-600 hover:underline">Resize Image Tool</Link>
              </li>
              <li>
                <Link to="/passport-photo" className="text-indigo-600 hover:underline">Passport Size Photo Maker</Link>
              </li>
              <li>
                <Link to="/signature-cropper" className="text-indigo-600 hover:underline">Signature Cropper</Link>
              </li>
              <li>
                <Link to="/resize-image-to-50kb" className="text-indigo-600 hover:underline">Resize to 50KB</Link>
              </li>
            </ul>
          </section>
        </section>
      </div>
    </>
  );
}
