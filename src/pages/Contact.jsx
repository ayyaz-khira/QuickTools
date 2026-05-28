import { useState } from 'react';
import SEO from '../components/SEO';

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <SEO
        title="Contact QuickTools"
        description="Contact QuickTools for support, feedback, or partnership inquiries. We respond to messages promptly."
      />

      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <h1 className="text-2xl font-extrabold">Contact</h1>

        <div className="space-y-4 text-sm text-slate-700">
          <p>We welcome feedback and bug reports. Use the form below to send a short message.</p>

          {!sent ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-3"
            >
              <input aria-label="Your name" placeholder="Your name" className="w-full rounded-md border p-2" />
              <input aria-label="Your email" placeholder="Your email" className="w-full rounded-md border p-2" />
              <textarea aria-label="Message" placeholder="Message" className="w-full rounded-md border p-2 h-32" />
              <button className="rounded-2xl bg-indigo-600 text-white px-4 py-2">Send</button>
            </form>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Thanks — your message was noted.</div>
          )}

          <p className="text-xs text-slate-500">Note: This form does not attach files. For support related to a specific tool, please mention the tool name.</p>
        </div>
      </div>
    </>
  );
}
