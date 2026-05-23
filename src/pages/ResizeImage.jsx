import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ResizeTool from '../components/ResizeTool';

export default function ResizeImage() {
  return (
    <>
      <SEO
        title="Resize Image to KB Online Free | QuickTools"
        description="Compress and resize images to exact KB limits in your browser with privacy-first local processing. Great for portal uploads, forms, and ID requirements."
      />
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">Resize Image to Target KB</h1>
          <p className="text-slate-600 text-sm">
            Optimize and compress your image files directly to your requested size. Excellent for online admission portals, passport forms, and visa applications that require files under a specific limit (e.g. 50 KB or 100 KB).
          </p>
        </div>

        <ResizeTool defaultTargetKb={50} />

        <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
          <div>
            <h2 id="resize-overview" className="text-2xl font-bold text-slate-900">Resize Image Tool Overview</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Resize Image Tool lets you reduce photo file size instantly in the browser. Keep the image private with local-only processing and avoid server uploads for application forms and online portals.
            </p>
          </div>

          <section aria-labelledby="resize-features" className="space-y-4">
            <h3 id="resize-features" className="text-xl font-semibold text-slate-900">Features</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="list-disc list-inside">Precise target KB compression for 20, 50, 100, or 200 KB limits.</li>
              <li className="list-disc list-inside">Fast local processing with quality-first binary search compression.</li>
              <li className="list-disc list-inside">Preview original and compressed output side-by-side.</li>
              <li className="list-disc list-inside">No uploads, no external servers, no privacy leaks.</li>
            </ul>
          </section>

          <section aria-labelledby="resize-usage" className="space-y-4">
            <h3 id="resize-usage" className="text-xl font-semibold text-slate-900">How to Use</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
              <li>Upload a JPG, PNG, or WEBP image using the file picker or drag-and-drop.</li>
              <li>Select your desired maximum file size from the preset options or choose a custom limit.</li>
              <li>Wait for the browser to generate the optimized preview.</li>
              <li>Download the compressed image directly to your device.</li>
            </ol>
          </section>

          <section aria-labelledby="resize-faq" className="space-y-4">
            <h3 id="resize-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Will my image be uploaded?</p>
                <p>No. Compression happens completely inside your browser, and the image is never sent to any server.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">What file sizes work best?</p>
                <p>Most JPG, PNG, and WEBP photos under 12 MB work well for local compression and preview generation.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Can I use this for online forms?</p>
                <p>Yes. The tool is ideal for portals and applications that require exact KB limits and fast client-side workflow.</p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
