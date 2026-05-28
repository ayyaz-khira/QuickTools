import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy | QuickTools"
        description="Privacy Policy for QuickTools — we process files locally in the browser and do not upload user files to our servers."
      />

      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <h1 className="text-2xl font-extrabold">Privacy Policy</h1>
        <p className="text-sm text-slate-600">Last updated: 2026-05-27</p>

        <div className="space-y-4 text-sm text-slate-700">
          <p>
            QuickTools is committed to protecting your privacy. Most tools on QuickTools run entirely in your browser — files
            you upload are processed locally and are not sent to our servers. We do not store or retain your images, documents,
            or personal data from these tools.
          </p>

          <h2 className="font-semibold">Data we collect</h2>
          <p>We collect minimal analytics data for performance and usage monitoring (via Vercel Analytics).</p>

          <h2 className="font-semibold">Third-party services</h2>
          <p>
            QuickTools uses third-party libraries that run inside the browser. We do not share your files with these services.
          </p>

          <h2 className="font-semibold">Contact</h2>
          <p>If you have privacy questions please visit the Contact page.</p>
        </div>
      </div>
    </>
  );
}
