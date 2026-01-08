import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loansAPI, booksAPI } from '../services/api';
import { BookOpen, BookMarked, AlertCircle, TrendingUp } from 'lucide-react';

const DashboardPage = () => {
  const { user, isEditor } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isEditor) {
          const [loanStats, booksResponse] = await Promise.all([
            loansAPI.getStats(),
            booksAPI.getAll({ limit: 1 })
          ]);
          setStats({
            ...loanStats.data.data.stats,
            totalBooks: booksResponse.data.data.pagination.total
          });
        } else {
          const myLoans = await loansAPI.getMy({ status: 'active' });
          setStats({
            myActiveLoans: myLoans.data.data.pagination.total
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isEditor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        שלום, {user?.fullName}! 👋
      </h1>

      {isEditor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="סה״כ ספרים"
            value={stats?.totalBooks || 0}
            icon={BookOpen}
            color="blue"
          />
          <StatCard
            title="השאלות פעילות"
            value={stats?.active || 0}
            icon={BookMarked}
            color="green"
          />
          <StatCard
            title="השאלות באיחור"
            value={stats?.overdue || 0}
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="סה״כ השאלות"
            value={stats?.total || 0}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="ההשאלות שלי"
            value={stats?.myActiveLoans || 0}
            icon={BookMarked}
            color="blue"
          />
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">ברוכים הבאים למערכת ניהול הספרייה</h2>
        <p className="text-gray-600">
          כאן תוכל לנהל את כל פעילויות הספרייה - צפייה בספרים, ניהול השאלות ועוד.
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
