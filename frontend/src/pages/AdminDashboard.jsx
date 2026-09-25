import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineTrash, HiOutlineUsers, HiOutlineDocumentText } from "react-icons/hi2";
import api from "../lib/api";
import LoadingScreen from "../components/LoadingScreen";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalBlogs: 0 });
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, blogsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/blogs"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setBlogs(blogsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user and all their blogs?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await api.delete(`/admin/blogs/${blogId}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete blog");
    }
  };

  if (loading) {
    return <LoadingScreen title="Loading Dashboard" message="Fetching administrative data" />;
  }

  if (error) {
    return (
      <div className="page-container admin-error">
        <h2>Access Denied or Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")} className="button-primary">Go Home</button>
      </div>
    );
  }

  return (
    <div className="page-container admin-dashboard">
      <header className="admin-header glass-panel">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1>Site Management</h1>
        </div>
        <div className="admin-stats">
          <div className="admin-stat-card glass-panel">
            <HiOutlineUsers className="admin-stat-icon" />
            <div className="admin-stat-info">
              <strong>{stats.totalUsers}</strong>
              <span>Total Users</span>
            </div>
          </div>
          <div className="admin-stat-card glass-panel">
            <HiOutlineDocumentText className="admin-stat-icon" />
            <div className="admin-stat-info">
              <strong>{stats.totalBlogs}</strong>
              <span>Total Blogs</span>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-controls">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Manage Users
        </button>
        <button
          className={`admin-tab ${activeTab === "blogs" ? "active" : ""}`}
          onClick={() => setActiveTab("blogs")}
        >
          Manage Blogs
        </button>
      </div>

      <div className="admin-content glass-panel">
        {activeTab === "users" ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Admin</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.isAdmin ? "Yes" : "No"}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {!user.isAdmin && (
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDeleteUser(user._id)}
                          title="Delete User"
                        >
                          <HiOutlineTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id}>
                    <td>{blog.title}</td>
                    <td>{blog.category || "N/A"}</td>
                    <td>{blog.author || "Unknown"}</td>
                    <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDeleteBlog(blog._id)}
                        title="Delete Blog"
                      >
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
