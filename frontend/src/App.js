import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateContest from './pages/CreateContest';
import JoinContest from './pages/JoinContest';
import Lobby from './pages/Lobby';
import ContestRoom from './pages/ContestRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateContest />} />
        <Route path="/join" element={<JoinContest />} />
        <Route path="/lobby/:contestId" element={<Lobby />} />
        <Route path="/contest/:contestId" element={<ContestRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;