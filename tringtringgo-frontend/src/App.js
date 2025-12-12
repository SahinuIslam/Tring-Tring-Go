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

// optional saved places
// import SavedPlacesPage from "./SavedPlacesPage";

//Services
//import TravelerDashboard from "./pages/TravelerDashboard";
import Services from "./Services";



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

        {/* dashboards WITHOUT layout (direct routes) */}
        <Route path="/traveler" element={<TravelerDashboard />} />
        {/* <Route path="/saved-places" element={<SavedPlacesPage />} /> */}
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/community" element={<CommunityFeed />} />

        <Route path="/services" element={<Services />} />
        <Route path="/traveler" element={<TravelerDashboard />} />


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


