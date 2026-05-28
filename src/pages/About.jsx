import SEO from '../components/SEO';

export default function About() {
  return (
    <>
      <SEO
        title="About QuickTools"
        description="QuickTools provides fast, privacy-first browser-based image and PDF utilities. Learn more about our mission and approach."
      />

      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <h1 className="text-2xl font-extrabold">About QuickTools</h1>

        <div className="space-y-4 text-sm text-slate-700">
          <p>
            QuickTools is a collection of lightweight browser utilities for everyday image and PDF tasks. Our focus is on
            privacy, speed, and keeping tools simple to use. Most features run entirely in the browser so your data stays on
            your device.
          </p>

          <h2 className="font-semibold">Mission</h2>
          <p>Provide reliable local-first utilities for quick everyday tasks without signups or uploads.</p>
        </div>
      </div>
    </>
  );
}
