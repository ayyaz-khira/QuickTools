import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PassportPhoto from './pages/PassportPhoto';
import ResizeImage from './pages/ResizeImage';
import SignatureCropper from './pages/SignatureCropper';
import './App.css';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/passport-photo" element={<PassportPhoto />} />
          <Route path="/resize-image" element={<ResizeImage />} />
          <Route path="/signature-cropper" element={<SignatureCropper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>


        <Analytics />
      </Layout>
    </Router>
  );
}

export default App;
