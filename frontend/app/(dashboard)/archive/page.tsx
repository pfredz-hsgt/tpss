'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import RichTextDisplay from '@/components/RichTextDisplay';
import { format } from 'date-fns';
import { announcementApi, publicApi, Announcement, Category } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ArchivePage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, dateFilter, searchQuery, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const cats = await publicApi.getCategories();
      setCategories(cats);

      const params: any = { archived: 'true' };
      if (selectedCategory !== 'all') {
        params.categoryId = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedDate) {
        params.targetDate = selectedDate;
      }

      const anns = await announcementApi.getAnnouncements(params);
      setAnnouncements(anns);
    } catch (error) {
      console.error('Failed to load archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    // If a specific date is selected, filter by that date
    if (selectedDate) {
      const annDate = ann.targetDate ? new Date(ann.targetDate) : new Date(ann.createdAt);
      const selected = new Date(selectedDate);
      return formatLocalDate(annDate) === formatLocalDate(selected);
    }
    
    // Otherwise use the date filter
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(ann.createdAt) >= today;
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(ann.createdAt) >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(ann.createdAt) >= monthAgo;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileMenu />
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-8">
      <div className="pl-12 md:pl-1">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Past Archive</h1>
        </div>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 w-full sm:min-w-0 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:border-slate-300 transition-colors"
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setSelectedDate(''); // Clear selected date when using filter
              }}
              className="w-full sm:w-auto px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDateFilter('all'); // Clear filter when using date selector
              }}
              className="w-full sm:w-auto px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
              placeholder="Select specific date"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg font-medium">No archived announcements found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                {/* Title Section */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                  <h3 className="text-base md:text-lg font-bold break-words text-slate-900">{ann.title}</h3>
                  {ann.archivedAt && (
                    <span className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg self-start">
                      📦 Archived
                    </span>
                  )}
                </div>

                {/* User, Category, Date Section */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mb-4">
                  <span className="font-semibold text-slate-900">{ann.author?.fullName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{ann.category?.name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{format(new Date(ann.createdAt), 'MMM d, yyyy HH:mm')}</span>
                  {ann.archivedAt && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Archived: {format(new Date(ann.archivedAt), 'MMM d, yyyy')}</span>
                    </>
                  )}
                </div>

                {/* Separator */}
                <div className="border-t-2 border-slate-100 mb-4"></div>

                {/* Content Section */}
                <div className="text-slate-700 mb-4">
                  <RichTextDisplay text={ann.content} />
                </div>

                {/* Separator */}
                {ann.responses && ann.responses.length > 0 && (
                  <div className="border-t-2 border-slate-100 mb-4"></div>
                )}
                
                {/* Responses Section */}
                {(() => {
                  const userResponse = ann.responses?.find(r => r.userId === user?.id);
                  
                  if (userResponse) {
                    // Show only current user's response
                    return (
                      <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
                        <div className="text-sm text-slate-700">
                          <span className="font-semibold text-emerald-700">{user?.fullName}:</span> {userResponse.response}
                          <span className="ml-2 text-slate-500">
                            ({format(new Date(userResponse.createdAt), 'MMM d, HH:mm')})
                          </span>
                        </div>
                      </div>
                    );
                  } else if (ann.responses && ann.responses.length > 0) {
                    // Show all responses if current user hasn't responded
                    return (
                      <div>
                        <div className="text-xs font-semibold text-slate-600 mb-3">All Responses ({ann.responses.length}):</div>
                        <div className="space-y-2">
                          {ann.responses.map((response) => (
                            <div key={response.id} className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                              <span className="font-semibold text-slate-900">{response.user?.fullName || 'Unknown User'}:</span>
                              <span className="ml-2 break-words">{response.response}</span>
                              <span className="ml-2 text-slate-400 text-xs">
                                ({format(new Date(response.createdAt), 'MMM d, HH:mm')})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

