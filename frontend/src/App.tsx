import { Route, Routes } from "react-router-dom";
import LandingPage from "@pages/LandingPage";
import LoginPage from "@pages/LoginPage";
import SignupPage from "@pages/SignupPage";
import AdminLoginPage from "@pages/AdminLoginPage";
import AdminHomePage from "@pages/AdminHomePage";
import StaffManagementPage from "@pages/StaffManagementPage";
import ProfilePage from "@pages/ProfilePage";
import SmartCardsPage from "@pages/SmartCardsPage";
import SmartCardsListPage from "@pages/SmartCardsListPage";
import SmartCardPublicPage from "@pages/SmartCardPublicPage";
import RequireStaffAuth from "@components/RequireStaffAuth";
import AdminLayout from "@layouts/AdminLayout";
import { ROUTES } from "@config/routes";

function App() {
  return (
    <Routes>
      <Route path={ROUTES.landing} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.signup} element={<SignupPage />} />
      <Route path={ROUTES.adminLogin} element={<AdminLoginPage />} />
      <Route path={ROUTES.smartCardPublic} element={<SmartCardPublicPage />} />

      <Route element={<RequireStaffAuth />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.adminHome} element={<AdminHomePage />} />
          <Route path={ROUTES.adminStaff} element={<StaffManagementPage />} />
          <Route path={ROUTES.adminProfile} element={<ProfilePage />} />
          <Route path={ROUTES.adminSmartCards} element={<SmartCardsPage />} />
          <Route
            path={ROUTES.adminSmartCardsList}
            element={<SmartCardsListPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
