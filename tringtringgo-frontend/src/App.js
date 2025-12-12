import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./layout"; // NEW

// import auth pages
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";

// import dashboards from pages
import TravelerDashboard from "./pages/TravelerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// import community feed
import CommunityFeed from "./CommunityFeed";

function App() {
  return (
    <Router>
      <Routes>
        {/* auth pages WITHOUT layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* default: go to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* everything else WITH layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/traveler" element={<TravelerDashboard />} />
                <Route path="/merchant" element={<MerchantDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/community" element={<CommunityFeed />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}


export default App;
