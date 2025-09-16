import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AdminProps {
  user: User | null;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    password: '',
    is_admin: false
  });

  useEffect(() => {
    if (user?.is_admin) {
      loadUsers();
    }
  }, [user]);

  // 显示消息
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // API 请求函数
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await fetch(`/api${url}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return null;
    }

    return response;
  };

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/users/admin/users');
      if (response?.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        showMessage('加载用户列表失败', 'error');
      }
    } catch (error) {
      showMessage('加载用户列表失败: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 创建用户
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await apiRequest('/users/admin/create-user', {
        method: 'POST',
        body: JSON.stringify(createUserForm)
      });

      if (response?.ok) {
        const result = await response.json();
        showMessage(result.message, 'success');
        setCreateUserForm({
          username: '',
          email: '',
          password: '',
          is_admin: false
        });
        loadUsers();
      } else {
        const error = await response?.json();
        showMessage(error?.detail || '创建用户失败', 'error');
      }
    } catch (error) {
      showMessage('创建用户失败: ' + (error as Error).message, 'error');
    }
  };

  // 删除用户
  const deleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await apiRequest(`/users/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response?.ok) {
        const result = await response.json();
        showMessage(result.message, 'success');
        loadUsers();
      } else {
        const error = await response?.json();
        showMessage(error?.detail || '删除用户失败', 'error');
      }
    } catch (error) {
      showMessage('删除用户失败: ' + (error as Error).message, 'error');
    }
  };

  // 检查权限
  if (!user) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <p className="text-gray-600">需要登录后才能访问管理后台</p>
        </div>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">权限不足</h2>
          <p className="text-gray-600">只有管理员才能访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🛠️ 管理后台</h2>
        <p className="text-gray-600">用户管理系统</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create User Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">创建新用户</h3>
        <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名 *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={createUserForm.username}
              onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 *
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={createUserForm.email}
              onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 *
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={createUserForm.password}
              onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                checked={createUserForm.is_admin}
                onChange={(e) => setCreateUserForm(prev => ({ ...prev, is_admin: e.target.checked }))}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                管理员权限
              </span>
            </label>
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              创建用户
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">用户列表</h3>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-top-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    权限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((adminUser) => (
                  <tr key={adminUser.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {adminUser.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adminUser.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adminUser.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        adminUser.is_admin 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {adminUser.is_admin ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(adminUser.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {adminUser.username !== 'admin' ? (
                        <button
                          onClick={() => deleteUser(adminUser.id, adminUser.username)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      ) : (
                        <span className="text-gray-400">系统管理员</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无用户数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;