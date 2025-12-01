'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import { useAuth } from '@/lib/auth';
import { adminApi, User, Group, Category, Template } from '@/lib/api';
import { UserRole } from '@/types';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'categories' | 'templates'>('users');
  
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Always load categories and users as they're needed for forms
      const [usersData, groupsData, categoriesData, templatesData] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        adminApi.getGroups().catch(() => []),
        adminApi.getCategories().catch(() => []),
        adminApi.getTemplates().catch(() => []),
      ]);

      setUsers(usersData);
      setGroups(groupsData);
      setCategories(categoriesData);
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    loadData();
  }, [isAdmin, loadData]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Admin access required
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileMenu />
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
      <div className="pl-12 md:pl-1">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Admin Dashboard</h1>
      </div>
      <div className="border-b-2 border-slate-200 mb-6">
        <nav className="-mb-0.5 flex flex-wrap gap-2 md:gap-4">
          {(['users', 'groups', 'categories', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 md:py-4 px-4 md:px-5 border-b-2 font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 transform scale-105'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'users' && <UsersTab users={users} onRefresh={loadData} groups={groups} />}
          {activeTab === 'groups' && <GroupsTab groups={groups} onRefresh={loadData} users={users} />}
          {activeTab === 'categories' && <CategoriesTab categories={categories} onRefresh={loadData} />}
          {activeTab === 'templates' && <TemplatesTab templates={templates} onRefresh={loadData} categories={categories} />}
        </>
      )}
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, onRefresh, groups }: { users: User[]; onRefresh: () => void; groups: Group[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Users</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-md hover:shadow-lg transition-all"
        >
          Create User
        </button>
      </div>
      
      <div className="bg-white shadow-lg overflow-hidden rounded-xl">
        <ul className="divide-y divide-slate-100">
          {users.map((user) => (
            <li key={user.id} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{user.fullName}</p>
                  <p className="text-sm text-gray-500 break-words">{user.username} • {user.email || 'No email'}</p>
                  <p className="text-xs text-gray-400">Role: {user.role}</p>
                  {user.groups && user.groups.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 break-words">
                      Groups: {user.groups.map(g => g.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 text-sm px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete user "${user.fullName}"?`)) {
                        try {
                          await adminApi.deleteUser(user.id);
                          onRefresh();
                        } catch (err: any) {
                          alert(err.message || 'Failed to delete user');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-white bg-red-50 hover:bg-red-600 text-sm px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showCreate && (
        <UserForm
          groups={groups}
          onClose={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}

      {editingUser && (
        <UserForm
          user={editingUser}
          groups={groups}
          onClose={() => {
            setEditingUser(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Groups Tab Component
function GroupsTab({ groups, onRefresh, users }: { groups: Group[]; onRefresh: () => void; users: User[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Groups</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
        >
          Create Group
        </button>
      </div>
      
      <div className="bg-white shadow-lg overflow-hidden rounded-xl">
        <ul className="divide-y divide-gray-200">
          {groups.map((group) => (
            <li key={group.id} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{group.name}</p>
                  <p className="text-sm text-gray-500 break-words">{group.description || 'No description'}</p>
                  {group.users && group.users.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Users: {group.users.map(u => u.fullName).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete group "${group.name}"?`)) {
                        try {
                          await adminApi.deleteGroup(group.id);
                          onRefresh();
                        } catch (err: any) {
                          alert(err.message || 'Failed to delete group');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showCreate && (
        <GroupForm
          users={users}
          onClose={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}

      {editingGroup && (
        <GroupForm
          group={editingGroup}
          users={users}
          onClose={() => {
            setEditingGroup(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Categories Tab Component
function CategoriesTab({ categories, onRefresh }: { categories: Category[]; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Categories</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
        >
          Create Category
        </button>
      </div>
      
      <div className="bg-white shadow-lg overflow-hidden rounded-xl">
        <ul className="divide-y divide-gray-200">
          {categories.map((category) => (
            <li key={category.id} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{category.name}</p>
                  <p className="text-sm text-gray-500 break-words">Slug: {category.slug}</p>
                  {category.color && (
                    <span
                      className="inline-block w-4 h-4 rounded-full mt-1"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
                        try {
                          await adminApi.deleteCategory(category.id);
                          onRefresh();
                        } catch (err: any) {
                          alert(err.message || 'Failed to delete category');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-900 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showCreate && (
        <CategoryForm
          onClose={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}

      {editingCategory && (
        <CategoryForm
          category={editingCategory}
          onClose={() => {
            setEditingCategory(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Templates Tab Component
function TemplatesTab({ templates, onRefresh, categories }: { templates: Template[]; onRefresh: () => void; categories: Category[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Templates</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
        >
          Create Template
        </button>
      </div>
      
      <div className="bg-white shadow-lg overflow-hidden rounded-xl">
        <ul className="divide-y divide-gray-200">
          {templates.map((template) => (
            <li key={template.id} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{template.name}</p>
                  <p className="text-sm text-gray-500 break-words">
                    Category: {template.category?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 break-words">
                    Content: {typeof template.questions === 'string' ? `${template.questions.length} chars` : (Array.isArray(template.questions) ? `${template.questions.length} items (legacy)` : 'N/A')}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                    template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete template "${template.name}"?`)) {
                        try {
                          await adminApi.deleteTemplate(template.id);
                          onRefresh();
                        } catch (err: any) {
                          alert(err.message || 'Failed to delete template');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-900 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showCreate && (
        <TemplateForm
          categories={categories}
          onClose={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}

      {editingTemplate && (
        <TemplateForm
          template={editingTemplate}
          categories={categories}
          onClose={() => {
            setEditingTemplate(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// User Form Component
function UserForm({ user, groups, onClose }: { user?: User; groups: Group[]; onClose: () => void }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    role: user?.role || 'USER',
    groupIds: user?.groups?.map(g => g.id) || [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          email: formData.email || undefined,
          fullName: formData.fullName,
          role: formData.role,
          groupIds: formData.groupIds,
        };
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        await adminApi.updateUser(user.id, updateData);
      } else {
        // Create new user
        if (!formData.password) {
          setError('Password is required for new users');
          setLoading(false);
          return;
        }
        await adminApi.createUser({
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          fullName: formData.fullName,
          role: formData.role,
          groupIds: formData.groupIds,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">{user ? 'Edit User' : 'Create User'}</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 930817016235"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. PF Atan, PPF Senah"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {groups.length === 0 ? (
                  <p className="text-sm text-gray-500">No groups available</p>
                ) : (
                  groups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.groupIds.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, groupIds: [...formData.groupIds, group.id] });
                          } else {
                            setFormData({ ...formData, groupIds: formData.groupIds.filter(id => id !== group.id) });
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{group.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function GroupForm({ group, users, onClose }: { group?: Group; users: User[]; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    userIds: group?.users?.map(u => u.id) || [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (group) {
        await adminApi.updateGroup(group.id, {
          name: formData.name,
          description: formData.description || undefined,
          userIds: formData.userIds,
        });
      } else {
        await adminApi.createGroup({
          name: formData.name,
          description: formData.description || undefined,
          userIds: formData.userIds,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">{group ? 'Edit Group' : 'Create Group'}</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Members
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-500">No users available</p>
                ) : (
                  users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.userIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, userIds: [...formData.userIds, user.id] });
                          } else {
                            setFormData({ ...formData, userIds: formData.userIds.filter(id => id !== user.id) });
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{user.fullName} ({user.username})</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : group ? 'Update Group' : 'Create Group'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    color: category?.color || '#3B82F6',
    icon: category?.icon || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || name.toUpperCase().replace(/\s+/g, '_'),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (category) {
        await adminApi.updateCategory(category.id, {
          name: formData.name,
          slug: formData.slug,
          color: formData.color || undefined,
          icon: formData.icon || undefined,
        });
      } else {
        await adminApi.createCategory({
          name: formData.name,
          slug: formData.slug,
          color: formData.color || undefined,
          icon: formData.icon || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">{category ? 'Edit Category' : 'Create Category'}</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., TDM, TPN, Transport"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug * (URL-friendly identifier)
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., TDM, TPN, TRANSPORT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (optional)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Icon name or emoji"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TemplateForm({ template, categories, onClose }: { template?: Template; categories: Category[]; onClose: () => void }) {
  // Get content from questions - if questions is a string, use it; if it's an array, convert to string
  const getTemplateContent = () => {
    if (!template?.questions) return '';
    if (typeof template.questions === 'string') return template.questions;
    // If it's an array (old format), convert to string
    if (Array.isArray(template.questions)) {
      return JSON.stringify(template.questions, null, 2);
    }
    return '';
  };

  const [formData, setFormData] = useState({
    name: template?.name || '',
    categoryId: template?.categoryId || '',
    isActive: template?.isActive ?? true,
    content: getTemplateContent(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (template) {
        await adminApi.updateTemplate(template.id, {
          name: formData.name,
          categoryId: formData.categoryId,
          questions: formData.content, // Store content as string in questions field
          isActive: formData.isActive,
        });
      } else {
        await adminApi.createTemplate({
          name: formData.name,
          categoryId: formData.categoryId,
          questions: formData.content, // Store content as string in questions field
          isActive: formData.isActive,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">{template ? 'Edit Template' : 'Create Template'}</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content * (Use *text* for bold, _text_ for italic)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter template content..."
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.content.trim()}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

