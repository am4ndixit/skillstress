import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkbenchProvider } from './context/WorkbenchContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { TestLabPage } from './pages/TestLabPage';
import { SkillLibraryPage } from './pages/SkillLibraryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <WorkbenchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="lab" element={<TestLabPage />} />
            <Route path="library" element={<SkillLibraryPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="runs" element={<Navigate to="/history" replace />} />
            <Route path="traces" element={<Navigate to="/history" replace />} />
            <Route path="graphify" element={<Navigate to="/" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkbenchProvider>
  );
};

export default App;
