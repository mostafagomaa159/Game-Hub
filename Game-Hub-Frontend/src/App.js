import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import NewPostForm from "./pages/NewPostForm";
import AllPosts from "./pages/AllPosts";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./components/TransactionHistory";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDepositDashboard from "./pages/AdminDashboard";
import { ToastContainer, Slide } from "react-toastify";
import { UserProvider } from "./context/UserContext";
import MyTransactions from "./pages/MyTransactions";
import DepositSuccess from "./pages/DepositSuccess";
import PostList from "./components/PostList";
import Requests from "./pages/Requests";
import "react-toastify/dist/ReactToastify.css";
import RulesPage from "./pages/AboutUs/RulesPage";
import InfoCenter from "./pages/AboutUs/InfoCenter";
import AboutPage from "./pages/AboutUs/AboutPage";
import HelpPage from "./pages/AboutUs/HelpPage";
import ContactPage from "./pages/AboutUs/ContactPage";
import PrivacyPolicyPage from "./pages/AboutUs/PrivacyPolicyPage";
import TermsPage from "./pages/AboutUs/TermsOfUsePage";
import DisclaimerPage from "./pages/AboutUs/DisclaimerPage";
import DisputePolicyPage from "./pages/AboutUs/DisputePolicyPage";
import UserProfilePage from "./pages/UserProfilePage.js";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Navbar />

          {/* Toast notifications container with pro styling and animation */}
          <ToastContainer
            position="top-center"
            autoClose={1000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            transition={Slide}
            toastStyle={{
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
              fontWeight: "600",
              fontSize: "14px",
              padding: "12px 20px",
              maxWidth: "380px",
            }}
          />

          <main className="flex-1 container mx-auto px-4 py-6">
            <Routes>
              {/* Redirect / to /all-posts */}
              <Route path="/" element={<Navigate to="/all-posts" />} />

              {/* Only logged in users can access Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <PostList />
                  </RequireAuth>
                }
              />

              <Route path="/requests" element={<Requests />} />

              <Route path="/all-posts" element={<AllPosts />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route
                path="/deposit"
                element={
                  <RequireAuth>
                    <Deposit />
                  </RequireAuth>
                }
              />
              <Route path="/deposit-success" element={<DepositSuccess />} />
              <Route path="/my-transactions" element={<MyTransactions />} />
              <Route path="/profile/:userId" element={<UserProfilePage />} />
              <Route
                path="/withdraw"
                element={
                  <RequireAuth>
                    <Withdraw />
                  </RequireAuth>
                }
              />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/deposits"
                element={
                  <RequireAdmin>
                    <AdminDepositDashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="/newpost"
                element={
                  <RequireAuth>
                    <NewPostForm />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/about" element={<InfoCenter />}>
                <Route path="rules" element={<RulesPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="disclaimer" element={<DisclaimerPage />} />
                <Route path="dispute-policy" element={<DisputePolicyPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
