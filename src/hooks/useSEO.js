import { useEffect } from 'react';

export default function useSEO({ title, description }) {
  useEffect(() => {
    document.title = title 
      ? `${title} | QuickTools` 
      : 'QuickTools - Local-First Passport Photo, Resize & Signature Utilities';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || 'High performance, privacy-first web utilities. All processing happens 100% locally in your browser.');
  }, [title, description]);
}
