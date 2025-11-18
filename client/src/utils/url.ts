const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const buildServerUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${SERVER_URL}${path}`;
  }
  return `${SERVER_URL}/${path}`;
};

export const buildPdfUrl = (pdfPath: string): string => {
  return buildServerUrl(pdfPath);
};