import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Home from './pages/Home';
import MyMovies from './pages/MyMovies';
import Games from './pages/Games';
import Admin from './pages/Admin';
import MovieDetail from './pages/MovieDetail';
import { User } from './types';
import { watchStatusApi } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [watchedCount, setWatchedCount] = useState(0);
  const [wantToWatchCount, setWantToWatchCount] = useState(0);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('解析用户数据失败:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWatchStats();
    }
  }, [user]);

  const loadWatchStats = async () => {
    if (!user) return;
    
    try {
      const [watchedMovies, wantToWatchMovies] = await Promise.all([
        watchStatusApi.getAll('watched', 1, 1000), // 获取最多1000条
        watchStatusApi.getAll('want_to_watch', 1, 1000) // 获取最多1000条
      ]);
      
      setWatchedCount(watchedMovies.length);
      setWantToWatchCount(wantToWatchMovies.length);
    } catch (error) {
      console.error('加载观看统计失败:', error);
    }
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setWatchedCount(0);
    setWantToWatchCount(0);
  };

  const handleWatchStatusChange = () => {
    if (user) {
      loadWatchStats();
    }
  };

  const handleTagUpdate = () => {
    // 标签更新处理，传递给需要的页面
    if (user) {
      loadWatchStats();
    }
  };

  if (showLogin) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onToggleMode={() => setShowLogin(false)}
      />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
        <Header 
          user={user} 
          watchedCount={watchedCount}
          wantToWatchCount={wantToWatchCount}
          onLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
        />
        
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  user={user} 
                  onWatchStatusChange={handleWatchStatusChange} 
                />
              } 
            />
            <Route 
              path="/movie/:id" 
              element={
                <MovieDetail 
                  user={user} 
                  onWatchStatusChange={handleWatchStatusChange}
                  onTagUpdate={handleTagUpdate}
                />
              } 
            />
            <Route 
              path="/my-movies" 
              element={
                <MyMovies 
                  user={user} 
                />
              } 
            />
            <Route 
              path="/games" 
              element={
                <Games 
                  user={user} 
                />
              } 
            />
            <Route 
              path="/admin" 
              element={
                user?.is_admin ? (
                  <Admin user={user} />
                ) : (
                  <Home 
                    user={user} 
                    onWatchStatusChange={handleWatchStatusChange} 
                  />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Header component with navigation
interface HeaderProps {
  user: User | null;
  watchedCount: number;
  wantToWatchCount: number;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  watchedCount, 
  wantToWatchCount, 
  onLogin, 
  onLogout 
}) => {
  const location = useLocation();

  const NavigationLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          isActive 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🎬 影视游戏筛选器
              </h1>
              <p className="text-gray-600 mt-1">发现你喜欢的影视剧和游戏</p>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-4">
              <NavigationLink to="/">
                热门影视
              </NavigationLink>
              <NavigationLink to="/games">
                热门游戏
              </NavigationLink>
              {user && (
                <NavigationLink to="/my-movies">
                  我的影视
                </NavigationLink>
              )}
              {user?.is_admin && (
                <NavigationLink to="/admin">
                  管理后台
                </NavigationLink>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">欢迎, {user.username}</span>
                  <div className="flex gap-4 mt-1">
                    <span className="text-green-600">已看过: {watchedCount}</span>
                    <span className="text-blue-600">想看: {wantToWatchCount}</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  退出登录
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                登录/注册
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-4">
            <NavigationLink to="/">
              热门电影
            </NavigationLink>
            <NavigationLink to="/games">
              热门游戏
            </NavigationLink>
            {user && (
              <NavigationLink to="/my-movies">
                我的电影
              </NavigationLink>
            )}
            {user?.is_admin && (
              <NavigationLink to="/admin">
                管理后台
              </NavigationLink>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default App;