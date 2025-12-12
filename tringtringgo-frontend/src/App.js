import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./layout";

// auth pages
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";

// dashboards
import TravelerDashboard from "./pages/TravelerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Services
import Services from "./Services";

// chatbot (floating widget)
import ChatWidget from "./chatbot/ChatWidget";

// community & explore
import CommunityFeed from "./CommunityFeed";
import ExplorePage from "./ExplorePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* auth pages WITHOUT layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* default: go to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* everything else WITH layout (has top bar + ChatPanel) */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                {/* home and main pages under Layout */}
                
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/community" element={<CommunityFeed />} />
                <Route path="/services" element={<Services />} />

                {/* dashboards */}
                <Route path="/traveler" element={<TravelerDashboard />} />
                <Route path="/merchant" element={<MerchantDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>

      {/* floating AI chatbot widget, always available */}
      <ChatWidget />
    </Router>
  );
}

export default App;