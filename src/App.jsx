import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import { Suspense, lazy } from 'react';
const PassportPhoto = lazy(() => import('./pages/PassportPhoto'));
const ResizeImage = lazy(() => import('./pages/ResizeImage'));
const ResizeImageSeo = lazy(() => import('./pages/ResizeImageSeo'));
const CompressImage = lazy(() => import('./pages/CompressImage'));
const ImageToPDF = lazy(() => import('./pages/ImageToPDF'));
const AddPageNumbersToPDF = lazy(() => import('./pages/AddPageNumbersToPDF'));
const MergePDF = lazy(() => import('./pages/MergePDF'));
const BackgroundRemover = lazy(() => import('./pages/BackgroundRemover'));
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import About from './pages/About';
import Contact from './pages/Contact';
import SignatureCropper from './pages/SignatureCropper';
import './App.css';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/passport-photo"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <PassportPhoto />
              </Suspense>
            }
          />
          <Route
            path="/resize-image"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <ResizeImage />
              </Suspense>
            }
          />
          <Route
            path="/compress-image"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <CompressImage />
              </Suspense>
            }
          />
          <Route
            path="/image-to-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tool...</div>}>
                <ImageToPDF />
              </Suspense>
            }
          />
          <Route
            path="/jpg-to-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tool...</div>}>
                <ImageToPDF variant="jpg" />
              </Suspense>
            }
          />
          <Route
            path="/png-to-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tool...</div>}>
                <ImageToPDF variant="png" />
              </Suspense>
            }
          />
          <Route
            path="/images-to-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tool...</div>}>
                <ImageToPDF variant="images" />
              </Suspense>
            }
          />
          <Route
            path="/photo-to-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tool...</div>}>
                <ImageToPDF variant="photo" />
              </Suspense>
            }
          />
          <Route
            path="/add-page-numbers-to-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tools...</div>}>
                <AddPageNumbersToPDF />
              </Suspense>
            }
          />
          <Route
            path="/merge-pdf"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading PDF tools...</div>}>
                <MergePDF />
              </Suspense>
            }
          />
          <Route
            path="/background-remover"
            element={
              <Suspense fallback={<div className="text-center py-12">Loading Background Remover...</div>}>
                <BackgroundRemover />
              </Suspense>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resize-image-to-20kb" element={<ResizeImageSeo targetKb={20} />} />
          <Route path="/resize-image-to-50kb" element={<ResizeImageSeo targetKb={50} />} />
          <Route path="/resize-image-to-100kb" element={<ResizeImageSeo targetKb={100} />} />
          <Route path="/signature-cropper" element={<SignatureCropper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Analytics />
      </Layout>
    </Router>
  );
}

export default App;
