import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// import auth pages
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";

// import dashboards from pages
import TravelerDashboard from "./pages/TravelerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import SavedPlacesPage from "./SavedPlacesPage";



// import community feed
import CommunityFeed from "./CommunityFeed";
//import explore 
import ExplorePage from "./ExplorePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* dashboards */}
        <Route path="/traveler" element={<TravelerDashboard />} />
        <Route path="/saved-places" element={<SavedPlacesPage />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/explore" element={<ExplorePage />} />   
        <Route path="/community" element={<CommunityFeed />} 
    
        />

        {/* default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
