import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">הדף שחיפשת לא נמצא</p>
      <Link
        to="/dashboard"
        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Home className="w-5 h-5" />
        חזור לדף הבית
      </Link>
    </div>
  );
};
export default NotFoundPage;
