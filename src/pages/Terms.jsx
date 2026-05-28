import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms & Conditions | QuickTools"
        description="Terms and conditions for using QuickTools. QuickTools provides browser-based utilities; please review the usage terms."
      />

      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <h1 className="text-2xl font-extrabold">Terms & Conditions</h1>
        <p className="text-sm text-slate-600">Last updated: 2026-05-27</p>

        <div className="space-y-4 text-sm text-slate-700">
          <p>
            By using QuickTools, you agree to these terms. QuickTools provides browser-based image and PDF utilities. While
            the site aims to process files locally, network requests may occur for analytics or external libraries.
          </p>

          <h2 className="font-semibold">Limitations</h2>
          <p>Use the tools at your own risk. QuickTools is provided as-is without warranties.</p>

          <h2 className="font-semibold">Contact</h2>
          <p>For legal inquiries please visit the Contact page.</p>
        </div>
      </div>
    </>
  );
}
