'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import { announcementApi, passoverApi, publicApi, Category, Template, User, Group } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function CreatePage() {
  const { user } = useAuth();
  const [type, setType] = useState<'announcement' | 'passover'>('announcement');
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    try {
      const cats = await publicApi.getCategories();
      setCategories(cats);

      // Load templates for both announcement and passover
      const temps = await publicApi.getTemplates();
      setTemplates(temps);

      if (type === 'passover') {
        const grps = await publicApi.getGroups();
        setGroups(grps);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileMenu />
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-8">
      <div className="pl-12 md:pl-1">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Create New</h1>
        </div>
        <div className="mb-6">
          <div className="flex gap-4 border-b-2 border-slate-200">
            <button
              onClick={() => setType('announcement')}
              className={`py-3 px-5 border-b-2 font-semibold transition-all ${
                type === 'announcement'
                  ? 'border-indigo-600 text-indigo-600 transform scale-105'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Announcement
            </button>
            <button
              onClick={() => setType('passover')}
              className={`py-3 px-5 border-b-2 font-semibold transition-all ${
                type === 'passover'
                  ? 'border-cyan-600 text-cyan-600 transform scale-105'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Passover
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4 border-emerald-500 text-emerald-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
            <span className="font-medium">{success}</span>
          </div>
        )}

        {type === 'announcement' ? (
          <AnnouncementForm
            categories={categories}
            templates={templates}
            onSuccess={() => {
              setSuccess('Announcement created successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
            onError={(err) => setError(err)}
          />
        ) : (
          <PassoverForm
            categories={categories}
            groups={groups}
            currentUser={user}
            onSuccess={() => {
              setSuccess('Passover created successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
            onError={(err) => setError(err)}
          />
        )}
      </div>
    </div>
  );
}

function AnnouncementForm({ categories, templates, onSuccess, onError }: { 
  categories: Category[]; 
  templates: Template[];
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set default target date to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    templateId: '',
    isSticky: false,
    isPinned: false,
    targetDate: formatLocalDate(today), // Default to today
    taggedUserIds: [] as string[],
    taggedGroupIds: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      // Always use current date as target date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await announcementApi.createAnnouncement({
        ...formData,
        targetDate: formatLocalDate(today),
      });
      onSuccess();
      setFormData({
        title: '',
        content: '',
        categoryId: '',
        templateId: '',
        isSticky: false,
        isPinned: false,
        targetDate: formatLocalDate(new Date()),
        taggedUserIds: [],
        taggedGroupIds: [],
      });
    } catch (err: any) {
      onError(err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, templateId: '' })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Template (Optional)
          </label>
          <select
            value={formData.templateId}
            onChange={(e) => {
              const template = templates.find((t) => t.id === e.target.value);
              setFormData({
                ...formData,
                templateId: e.target.value,
                content: template ? (typeof template.questions === 'string' ? template.questions : (Array.isArray(template.questions) ? JSON.stringify(template.questions, null, 2) : String(template.questions))) : formData.content,
              });
            }}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="">Select a template (optional)</option>
            {templates
              .filter((t) => !formData.categoryId || t.categoryId === formData.categoryId)
              .map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Content * (Use *text* for bold, _text_ for italic)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          />
        </div>





        <div className="flex items-center gap-4">

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="mr-2"
            />
            Pinned
          </label>
        </div>


        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {loading ? 'Creating...' : 'Create Announcement'}
        </button>
      </div>
    </form>
  );
}

function PassoverForm({ categories, groups, currentUser, onSuccess, onError }: {
  categories: Category[];
  groups: Group[];
  currentUser: User | null;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [formData, setFormData] = useState({
    groupId: '',
    categoryId: '',
    content: '' as string,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    if (!formData.groupId || !formData.categoryId) {
      onError('Group and category are required');
      setLoading(false);
      return;
    }

    if (!formData.content || (typeof formData.content === 'string' && formData.content.trim() === '')) {
      onError('Content is required');
      setLoading(false);
      return;
    }

    try {
      // Upload files if any
      let attachments = null;
      if (selectedFiles.length > 0) {
        setUploading(true);
        const uploadResult = await passoverApi.uploadFiles(selectedFiles);
        attachments = uploadResult.files;
        setUploading(false);
      }

      // Create passover
      await passoverApi.createPassover({
        groupId: formData.groupId,
        categoryId: formData.categoryId,
        content: typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content),
        attachments: attachments || undefined,
      });
      
      onSuccess();
      setFormData({
        groupId: '',
        categoryId: '',
        content: '',
      });
      setSelectedFiles([]);
    } catch (err: any) {
      onError(err.message || 'Failed to create passover');
    } finally {
      setLoading(false);
      setUploading(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Passover to which unit
          </label>
          <select
            value={formData.groupId}
            onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            required
          >
            <option value="">Select a unit</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} {group.description ? `- ${group.description}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Content * (Use *text* for bold, _text_ for italic)
          </label>
          <textarea
            value={typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content, null, 2)}
            onChange={(e) => {
              setFormData({ ...formData, content: e.target.value });
            }}
            rows={10}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            placeholder="Enter passover content..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Attachments (Images, Documents, PDFs)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-6 py-3 rounded-lg hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {uploading ? 'Uploading files...' : loading ? 'Creating...' : 'Create Passover'}
        </button>
      </div>
    </form>
  );
}

