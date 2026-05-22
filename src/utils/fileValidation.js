const getExtension = (file) => {
  const name = file?.name || '';
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export const isSupportedImageFile = (file) => {
  if (!file) return false;
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  return supportedTypes.includes(file.type) || supportedExtensions.includes(getExtension(file));
};

export const isSupportedPdfFile = (file) => {
  if (!file) return false;
  return file.type === 'application/pdf' || getExtension(file) === 'pdf';
};
