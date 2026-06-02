import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ReportBanner from './components/layout/ReportBanner';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageTransition from './components/layout/PageTransition';
import Particles from './components/layout/Particles';
import { ToastProvider } from './components/ui/Toast';

import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Home/Home';
import CampaignMap from './pages/Game/CampaignMap/CampaignMap';
import GameHome from './pages/Game/GameHome/GameHome';
import Battle from './pages/Game/Battle/Battle';
import MissionBrief from './pages/Game/Battle/MissionBrief';
import BattleSetup from './pages/Game/Battle/BattleSetup';
import Debrief from './pages/Game/Debrief/Debrief';
import CodexList from './pages/Game/Codex/CodexList';
import CodexEntry from './pages/Game/Codex/CodexEntry';
import Training from './pages/Game/Training/Training';
import TapAllocation from './pages/Game/TapAllocation/TapAllocation';
import Dictionary from './pages/Game/Dictionary/Dictionary';
import PVPLobby from './pages/Game/PVP/PVPLobby';
import SquadSelect from './pages/Game/PVP/SquadSelect';
import Matchmaking from './pages/Game/PVP/Matchmaking';
import BattleReveal from './pages/Game/PVP/BattleReveal';
import PVPBattle from './pages/Game/PVP/PVPBattle';
import PVPDebrief from './pages/Game/PVP/PVPDebrief';
import Leaderboard from './pages/Game/PVP/Leaderboard';
import Customisation from './pages/Game/Customisation/Customisation';
import ThreatsList from './pages/Threats/ThreatsList';
import ThreatDetail from './pages/Threats/ThreatDetail';
import FactCheckUpload from './pages/FactCheck/FactCheckUpload';
import FactCheckAnalysing from './pages/FactCheck/FactCheckAnalysing';
import FactCheckResult from './pages/FactCheck/FactCheckResult';
import About from './pages/About/About';

import './App.css';

function App() {
  return (
    <SettingsProvider>
    <AuthProvider>
      <ToastProvider>
      <Particles />
      <div className="crt-overlay"></div>
      <ReportBanner />
      <Navbar />
      <main className="app-main">
        <PageTransition>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/threats" element={<ThreatsList />} />
          <Route path="/threats/:id" element={<ThreatDetail />} />

          {/* Protected */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/game" element={<ProtectedRoute><GameHome /></ProtectedRoute>} />
          <Route path="/game/campaign" element={<ProtectedRoute><CampaignMap /></ProtectedRoute>} />
          <Route path="/game/pve/:missionId" element={<ProtectedRoute><MissionBrief /></ProtectedRoute>} />
          <Route path="/game/pve/:missionId/setup" element={<ProtectedRoute><BattleSetup /></ProtectedRoute>} />
          <Route path="/game/pve/:missionId/fight" element={<ProtectedRoute><Battle /></ProtectedRoute>} />
          <Route path="/game/pve/:missionId/debrief" element={<ProtectedRoute><Debrief /></ProtectedRoute>} />
          <Route path="/game/codex" element={<ProtectedRoute><CodexList /></ProtectedRoute>} />
          <Route path="/game/codex/:entryId" element={<ProtectedRoute><CodexEntry /></ProtectedRoute>} />
          <Route path="/game/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
          <Route path="/game/tap" element={<ProtectedRoute><TapAllocation /></ProtectedRoute>} />
          <Route path="/game/dictionary" element={<ProtectedRoute><Dictionary /></ProtectedRoute>} />
          <Route path="/game/pvp" element={<ProtectedRoute><PVPLobby /></ProtectedRoute>} />
          <Route path="/game/pvp/squad" element={<ProtectedRoute><SquadSelect /></ProtectedRoute>} />
          <Route path="/game/pvp/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
          <Route path="/game/pvp/reveal" element={<ProtectedRoute><BattleReveal /></ProtectedRoute>} />
          <Route path="/game/pvp/battle" element={<ProtectedRoute><PVPBattle /></ProtectedRoute>} />
          <Route path="/game/pvp/debrief" element={<ProtectedRoute><PVPDebrief /></ProtectedRoute>} />
          <Route path="/game/pvp/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/game/customisation" element={<ProtectedRoute><Customisation /></ProtectedRoute>} />
          <Route path="/factcheck" element={<ProtectedRoute><FactCheckUpload /></ProtectedRoute>} />
          <Route path="/factcheck/analysing" element={<ProtectedRoute><FactCheckAnalysing /></ProtectedRoute>} />
          <Route path="/factcheck/result/:id" element={<ProtectedRoute><FactCheckResult /></ProtectedRoute>} />
        </Routes>
        </PageTransition>
      </main>
      <Footer />
      </ToastProvider>
    </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
