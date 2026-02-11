import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import {
  Dashboard,
  SolvePage,
  ProblemsPage,
  ContestsPage,
  TemplatesPage,
  SnippetsPage,
  SettingsPage,
  TimerPage,
  ProfilePage,
  RecommendPage,
  RivalsPage,
  VirtualContestPage,
} from '@/pages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solve" element={<SolvePage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/snippets" element={<SnippetsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/rivals" element={<RivalsPage />} />
          <Route path="/virtual-contest" element={<VirtualContestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
