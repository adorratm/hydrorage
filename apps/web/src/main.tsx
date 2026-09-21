import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Landing } from './Landing';
import {
  PrivacyPage,
  PrivacyPageEn,
  TermsPage,
  TermsPageEn,
  KvkkPage,
  AydinlatmaPage,
  CookiePage,
  CookiePageEn,
} from './LegalPages';
import { BlogIndex, BlogPostPage } from './Blog';
import { LocaleProvider } from './locale';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/gizlilik" element={<PrivacyPage />} />
          <Route path="/privacy" element={<PrivacyPageEn />} />
          <Route path="/kosullar" element={<TermsPage />} />
          <Route path="/terms" element={<TermsPageEn />} />
          <Route path="/kvkk" element={<KvkkPage />} />
          <Route path="/aydinlatma-metni" element={<AydinlatmaPage />} />
          <Route path="/cerez-politikasi" element={<CookiePage />} />
          <Route path="/cookies" element={<CookiePageEn />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);
