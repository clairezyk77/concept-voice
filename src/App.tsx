import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConceptSpaceProvider } from './store/ConceptSpaceContext.tsx';
import { UserKnowledgeProvider } from './store/UserKnowledgeContext.tsx';
import { MainLayout } from './layout/MainLayout.tsx';
import { EntryPage } from './pages/EntryPage.tsx';
import { ConceptSpacePage } from './pages/ConceptSpacePage.tsx';
import { KnowledgePage } from './pages/KnowledgePage.tsx';
import { StructuresPage } from './pages/StructuresPage.tsx';
import { OutputPage } from './pages/OutputPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <UserKnowledgeProvider>
        <ConceptSpaceProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<EntryPage />} />
              <Route path="/concept-space" element={<ConceptSpacePage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/structures" element={<StructuresPage />} />
              <Route path="/output" element={<OutputPage />} />
            </Route>
          </Routes>
        </ConceptSpaceProvider>
      </UserKnowledgeProvider>
    </BrowserRouter>
  );
}

export default App;
