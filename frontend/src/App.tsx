import { Route, Routes } from "react-router-dom";
import LandingPage from "@pages/LandingPage";
import LoginPage from "@pages/LoginPage";
import SignupPage from "@pages/SignupPage";
import InvitePage from "@pages/InvitePage";
import AdminLoginPage from "@pages/AdminLoginPage";
import AdminHomePage from "@pages/AdminHomePage";
import StaffManagementPage from "@pages/StaffManagementPage";
import ProfilePage from "@pages/ProfilePage";
import SmartCardsPage from "@pages/SmartCardsPage";
import SmartCardsListPage from "@pages/SmartCardsListPage";
import RedirectsPage from "@pages/RedirectsPage";
import EcardsPage from "@pages/EcardsPage";
import EcardListPage from "@pages/EcardListPage";
import EcardBuilderPage from "@pages/EcardBuilderPage";
import ExchangeContactFormsPage from "@pages/ExchangeContactFormsPage";
import ExchangeContactFormListPage from "@pages/ExchangeContactFormListPage";
import ExchangeContactFormBuilderPage from "@pages/ExchangeContactFormBuilderPage";
import CustomerOrganisationManagementPage from "@pages/CustomerOrganisationManagementPage";
import OrganisationDetailPage from "@pages/OrganisationDetailPage";
import OrganisationEcardTemplatePage from "@pages/OrganisationEcardTemplatePage";
import OrganisationExchangeContactFormTemplatePage from "@pages/OrganisationExchangeContactFormTemplatePage";
import PlansPage from "@pages/PlansPage";
import BusinessEventsPage from "@pages/BusinessEventsPage";
import EventDetailPage from "@pages/EventDetailPage";
import ProductsPage from "@pages/ProductsPage";
import ProductDetailPage from "@pages/ProductDetailPage";
import OrdersPage from "@pages/OrdersPage";
import OrderDetailPage from "@pages/OrderDetailPage";
import SmartCardPublicPage from "@pages/SmartCardPublicPage";
import EcardPublicPage from "@pages/EcardPublicPage";
import UserDashboardPage from "@pages/UserDashboardPage";
import UserExchangeContactFormsPage from "@pages/UserExchangeContactFormsPage";
import UserExchangeContactFormBuilderPage from "@pages/UserExchangeContactFormBuilderPage";
import UserEmailSignaturesPage from "@pages/UserEmailSignaturesPage";
import UserVirtualBackgroundsPage from "@pages/UserVirtualBackgroundsPage";
import UserBulkMessengerPage from "@pages/UserBulkMessengerPage";
import UserBulkMessengerSendPage from "@pages/UserBulkMessengerSendPage";
import UserScanCardPage from "@pages/UserScanCardPage";
import OrgDashboardPage from "@pages/OrgDashboardPage";
import DataMigrationPage from "@pages/DataMigrationPage";
import RequireStaffAuth from "@components/RequireStaffAuth";
import RequireSuperAdmin from "@components/RequireSuperAdmin";
import RequireAuth from "@components/RequireAuth";
import AdminLayout from "@layouts/AdminLayout";
import { ROUTES } from "@config/routes";

function App() {
  return (
    <Routes>
      <Route path={ROUTES.landing} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.signup} element={<SignupPage />} />
      <Route path={ROUTES.invite} element={<InvitePage />} />
      <Route path={ROUTES.adminLogin} element={<AdminLoginPage />} />
      <Route path={ROUTES.smartCardPublic} element={<SmartCardPublicPage />} />
      <Route path={ROUTES.ecardPublic} element={<EcardPublicPage />} />

      <Route element={<RequireAuth />}>
        <Route path={ROUTES.userDashboard} element={<UserDashboardPage />} />
        <Route
          path={ROUTES.userExchangeContactForms}
          element={<UserExchangeContactFormsPage />}
        />
        <Route
          path={ROUTES.userExchangeContactFormBuilder}
          element={<UserExchangeContactFormBuilderPage />}
        />
        <Route
          path={ROUTES.userEmailSignatures}
          element={<UserEmailSignaturesPage />}
        />
        <Route
          path={ROUTES.userVirtualBackgrounds}
          element={<UserVirtualBackgroundsPage />}
        />
        <Route
          path={ROUTES.userBulkMessenger}
          element={<UserBulkMessengerPage />}
        />
        <Route
          path={ROUTES.userBulkMessengerSend}
          element={<UserBulkMessengerSendPage />}
        />
        <Route path={ROUTES.userScanCard} element={<UserScanCardPage />} />
        <Route path={ROUTES.orgDashboard} element={<OrgDashboardPage />} />
      </Route>

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
          <Route path={ROUTES.adminRedirects} element={<RedirectsPage />} />
          <Route path={ROUTES.adminEcards} element={<EcardsPage />} />
          <Route path={ROUTES.adminCustomerEcards} element={<EcardListPage />} />
          <Route path={ROUTES.adminEcardBuilder} element={<EcardBuilderPage />} />
          <Route
            path={ROUTES.adminExchangeContactForms}
            element={<ExchangeContactFormsPage />}
          />
          <Route
            path={ROUTES.adminCustomerExchangeContactForms}
            element={<ExchangeContactFormListPage />}
          />
          <Route
            path={ROUTES.adminExchangeContactFormBuilder}
            element={<ExchangeContactFormBuilderPage />}
          />
          <Route
            path={ROUTES.adminCustomerOrganisations}
            element={<CustomerOrganisationManagementPage />}
          />
          <Route
            path={ROUTES.adminOrganisationDetail}
            element={<OrganisationDetailPage />}
          />
          <Route
            path={ROUTES.adminOrganisationEcardTemplate}
            element={<OrganisationEcardTemplatePage />}
          />
          <Route
            path={ROUTES.adminOrganisationExchangeContactFormTemplate}
            element={<OrganisationExchangeContactFormTemplatePage />}
          />
          <Route path={ROUTES.adminPlans} element={<PlansPage />} />
          <Route
            path={ROUTES.adminBusinessEvents}
            element={<BusinessEventsPage />}
          />
          <Route
            path={ROUTES.adminEventDetail}
            element={<EventDetailPage />}
          />
          <Route path={ROUTES.adminProducts} element={<ProductsPage />} />
          <Route
            path={ROUTES.adminProductDetail}
            element={<ProductDetailPage />}
          />
          <Route path={ROUTES.adminOrders} element={<OrdersPage />} />
          <Route
            path={ROUTES.adminOrderDetail}
            element={<OrderDetailPage />}
          />

          <Route element={<RequireSuperAdmin />}>
            <Route
              path={ROUTES.adminDataMigration}
              element={<DataMigrationPage />}
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
