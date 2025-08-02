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
import { ToastContainer } from "react-toastify";
import { UserProvider } from "./context/UserContext";
import MyTransactions from "./pages/MyTransactions";
import DepositSuccess from "./pages/DepositSuccess";
import PostList from "./components/PostList";
import Requests from "./pages/Requests";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Navbar />
          <ToastContainer position="top-center" theme="dark" autoClose={3000} />
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
