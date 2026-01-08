import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  Home,
  Library,
  BookMarked,
  Users,
  LogOut,
  User,
  Settings
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive(to)
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 text-primary-600">
            <BookOpen className="w-8 h-8" />
            <span className="font-bold text-xl hidden sm:block">ספריית הקיבוץ</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <NavLink to="/dashboard" icon={Home}>
              בית
            </NavLink>

            <NavLink to="/books" icon={Library}>
              קטלוג ספרים
            </NavLink>

            {!isEditor && (
              <NavLink to="/my-loans" icon={BookMarked}>
                ההשאלות שלי
              </NavLink>
            )}

            {isEditor && (
              <>
                <NavLink to="/manage-loans" icon={BookMarked}>
                  ניהול השאלות
                </NavLink>
                <NavLink to="/manage-books" icon={Library}>
                  ניהול ספרים
                </NavLink>
              </>
            )}

            {isAdmin && (
              <NavLink to="/manage-users" icon={Users}>
                ניהול משתמשים
              </NavLink>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
              <div className="text-xs text-gray-500">
                {user?.role === 'admin' && 'מנהל'}
                {user?.role === 'editor' && 'ספרן'}
                {user?.role === 'user' && 'משתמש'}
              </div>
            </div>

            <Link
              to="/profile"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="פרופיל"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="התנתק"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
