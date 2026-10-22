import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers/AppProviders';
import './index.css';
import { GalleryPage } from './app/pages/GalleryPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <GalleryPage />
    </AppProviders>
  </StrictMode>,
);
