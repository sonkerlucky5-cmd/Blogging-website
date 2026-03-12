import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import ThemeToggle from "./components/ThemeToggle";
import Home from "./pages/Home";
import CreateBlog from "./pages/CreateBlog";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BlogList from "./pages/BlogList";
import BlogDetails from "./pages/BlogDetails";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
function AppRoutes() {
  const location = useLocation();
  const { loading } = useAuth();

  const hideOnRoutes = ["/login", "/register"];
  const hideNavbar = hideOnRoutes.some((p) => location.pathname.startsWith(p));

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-loading">
          <LoadingScreen
            title="Loading workspace"
            message="Syncing your profile and preparing the publishing dashboard."
          />
        </main>
      </div>
    );
  }
  
  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}
      {hideNavbar && <ThemeToggle floating />}
      <main className={hideNavbar ? "auth-layout" : "main-content"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateBlog />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideNavbar && <Footer />}
    </div>
  );
}

export default App;
