import { Route, Routes } from "react-router-dom";
import LandingPage from "@pages/LandingPage";
import LoginPage from "@pages/LoginPage";
import SignupPage from "@pages/SignupPage";
import AdminLoginPage from "@pages/AdminLoginPage";
import AdminHomePage from "@pages/AdminHomePage";
import { ROUTES } from "@config/routes";

function App() {
  return (
    <Routes>
      <Route path={ROUTES.landing} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.signup} element={<SignupPage />} />
      <Route path={ROUTES.adminLogin} element={<AdminLoginPage />} />
      <Route path={ROUTES.adminHome} element={<AdminHomePage />} />
    </Routes>
  );
}

export default App;
