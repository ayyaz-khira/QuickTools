import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import PassportPhoto from './pages/PassportPhoto';
import ResizeImage from './pages/ResizeImage';
import ResizeImageSeo from './pages/ResizeImageSeo';
import CompressImage from './pages/CompressImage';
import ImageToPDF from './pages/ImageToPDF';
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
          <Route path="/passport-photo" element={<PassportPhoto />} />
          <Route path="/resize-image" element={<ResizeImage />} />
          <Route path="/compress-image" element={<CompressImage />} />
          <Route path="/image-to-pdf" element={<ImageToPDF />} />
          <Route path="/jpg-to-pdf" element={<ImageToPDF variant="jpg" />} />
          <Route path="/png-to-pdf" element={<ImageToPDF variant="png" />} />
          <Route path="/images-to-pdf" element={<ImageToPDF variant="images" />} />
          <Route path="/photo-to-pdf" element={<ImageToPDF variant="photo" />} />
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
