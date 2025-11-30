import "./App.css";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";

function App() {
  const showLogin = true; // change to false to see SignupPage instead
  return showLogin ? <LoginPage /> : <SignupPage />;
}

export default App;
