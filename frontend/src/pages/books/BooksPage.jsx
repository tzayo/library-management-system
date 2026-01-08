import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { booksAPI } from '../../services/api';
import { Search, BookOpen, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BooksPage = () => {
  const { isEditor } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [search, category]);

  const fetchBooks = async () => {
    try {
      const response = await booksAPI.getAll({ search, category, limit: 50 });
      setBooks(response.data.data.books);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await booksAPI.getCategories();
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">קטלוג ספרים</h1>
        {isEditor && (
          <Link
            to="/add-book"
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            הוסף ספר
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם ספר או סופר..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">כל הקטגוריות</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-20 h-28 object-cover rounded" />
                ) : (
                  <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{book.title}</h3>
                {book.author && <p className="text-gray-600 text-sm mb-2">{book.author}</p>}
                {book.category && (
                  <span className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded">
                    {book.category}
                  </span>
                )}
                <div className="mt-2">
                  {book.quantityAvailable > 0 ? (
                    <span className="text-green-600 text-sm font-medium">
                      זמין ({book.quantityAvailable} עותקים)
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">לא זמין</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">לא נמצאו ספרים</p>
        </div>
      )}
    </div>
  );
};

export default BooksPage;
