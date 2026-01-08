import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Public Pages
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/books/BooksPage';
import BookDetailsPage from './pages/books/BookDetailsPage';
import MyLoansPage from './pages/loans/MyLoansPage';

// Editor/Admin Pages
import ManageLoansPage from './pages/loans/ManageLoansPage';
import ManageBooksPage from './pages/books/ManageBooksPage';
import AddBookPage from './pages/books/AddBookPage';
import EditBookPage from './pages/books/EditBookPage';

// Admin Pages
import ManageUsersPage from './pages/users/ManageUsersPage';
import UserDetailsPage from './pages/users/UserDetailsPage';

// Other Pages
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Books */}
        <Route path="books" element={<BooksPage />} />
        <Route path="books/:id" element={<BookDetailsPage />} />

        {/* User Loans */}
        <Route path="my-loans" element={<MyLoansPage />} />

        {/* Editor/Admin Routes */}
        <Route
          path="manage-loans"
          element={
            <ProtectedRoute requiredRole="editor">
              <ManageLoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-books"
          element={
            <ProtectedRoute requiredRole="editor">
              <ManageBooksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="add-book"
          element={
            <ProtectedRoute requiredRole="editor">
              <AddBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit-book/:id"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditBookPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="manage-users"
          element={
            <ProtectedRoute requiredRole="admin">
              <ManageUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
