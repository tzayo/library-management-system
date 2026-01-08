import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data.user);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: userData } = response.data.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      toast.success('התחברת בהצלחה!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'שגיאה בהתחברות';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);

      toast.success('נרשמת בהצלחה!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'שגיאה ברישום';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('התנתקת בהצלחה');
  };

  // Update profile
  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.data.user);
      toast.success('הפרטים עודכנו בהצלחה');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'שגיאה בעדכון פרטים';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('הסיסמה שונתה בהצלחה');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'שגיאה בשינוי סיסמה';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Check if user has role
  const hasRole = (role) => {
    if (!user) return false;
    if (role === 'user') return true;
    if (role === 'editor') return user.role === 'editor' || user.role === 'admin';
    if (role === 'admin') return user.role === 'admin';
    return false;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAuthenticated: !!user,
    isUser: user?.role === 'user',
    isEditor: user?.role === 'editor' || user?.role === 'admin',
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
