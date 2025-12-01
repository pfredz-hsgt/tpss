'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import NotificationCenter from '@/components/NotificationCenter';
import RichTextDisplay from '@/components/RichTextDisplay';
import { format } from 'date-fns';
import { announcementApi, passoverApi, publicApi, Announcement, Passover } from '@/lib/api';
import { Category } from '@/types';
import { useAuth } from '@/lib/auth';

function HomePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'announcements' | 'passover'>('announcements');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [passovers, setPassovers] = useState<Passover[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle URL parameters for tab and passoverId
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'passover' || tab === 'announcements') {
      setActiveTab(tab);
    }
    // Scroll to specific passover if passoverId is provided
    const passoverId = searchParams?.get('passoverId');
    if (passoverId && tab === 'passover') {
      setTimeout(() => {
        const element = document.getElementById(`passover-${passoverId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-cyan-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-cyan-500', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const cats = await publicApi.getCategories();
      setCategories(cats);

      // Load announcements
      const anns = await announcementApi.getAnnouncements(
        activeCategory !== 'all' ? { categoryId: activeCategory } : {}
      );
      setAnnouncements(anns);

      // Load passovers
      const pass = await passoverApi.getPassovers();
      setPassovers(pass);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const filteredAnnouncements = announcements.filter((ann) => {
    if (activeCategory !== 'all' && ann.categoryId !== activeCategory) return false;
    if (searchQuery && !ann.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !ann.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return !ann.archivedAt;
  });

  const stickyAnnouncements = filteredAnnouncements.filter((ann) => ann.isSticky || ann.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter((ann) => !ann.isSticky && !ann.isPinned);

  const pendingPassovers = passovers.filter((p) => p.status === 'PENDING');

  // Calculate active announcements (not responded by ANY user)
  const activeAnnouncements = announcements.filter((ann) => {
    if (ann.archivedAt) return false; // Exclude archived
    return !ann.responses || ann.responses.length === 0; // Return true if no one has responded
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileMenu />
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-8">
        <div className="mb-6 flex flex-row items-center justify-between gap-4">
          <div className="pl-12 md:pl-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Home</h1>
            <p className="text-sm md:text-base text-slate-600 font-medium">{today}</p>
          </div>
          <NotificationCenter />
        </div>

        {/* Main Tabs - Announcements and Passover */}
        <div className="mb-6">
          <nav className="flex flex-wrap gap-3 md:gap-4">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all shadow-md ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg transform scale-105 border-2 border-indigo-800'
                  : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border-2 border-slate-200 hover:border-indigo-300'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('passover')}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all shadow-md ${
                activeTab === 'passover'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg transform scale-105 border-2 border-cyan-800'
                  : 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 border-2 border-slate-200 hover:border-cyan-300'
              }`}
            >
              Passover
            </button>
          </nav>
        </div>

        {activeTab === 'announcements' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:border-slate-300 transition-colors"
              />
            </div>

            {/* Category Tabs */}
            <div className="mb-6 border-b border-slate-200 pb-2">
              <nav className="flex flex-wrap gap-1.5 md:gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-medium text-xs md:text-sm transition-all ${
                    activeCategory === 'all'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-medium text-xs md:text-sm transition-all ${
                      activeCategory === cat.id
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}

        {activeTab === 'announcements' && (
          <>
            {/* Summary Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mb-3">
              <div className="text-center bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-sm text-indigo-100 font-medium">Active Announcements</p>
                <p className="text-3xl font-bold text-white mt-2">{activeAnnouncements.length}</p>
                <p className="text-xs text-indigo-100 mt-1">New Announcement</p>
              </div>
              <div className="text-center bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-sm text-amber-100 font-medium">Sticky Announcements</p>
                <p className="text-3xl font-bold text-white mt-2">{announcements.filter((ann) => !ann.archivedAt && (ann.isSticky || ann.isPinned)).length}</p>
                <p className="text-xs text-amber-100 mt-1">Pinned items</p>
              </div>
            </div>

            {/* Sticky Announcements */}
            {stickyAnnouncements.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Sticky Announcements</h2>
                <div className="space-y-4">
                  {stickyAnnouncements.map((ann) => (
                    <AnnouncementCard key={ann.id} announcement={ann} onResponse={loadData} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {activeCategory === 'all' 
                  ? 'Announcements' 
                  : `${categories.find(cat => cat.id === activeCategory)?.name || 'Announcements'} Announcements`}
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : regularAnnouncements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No announcements found</p>
              ) : (
                <div className="space-y-4">
                  {regularAnnouncements.map((ann) => (
                    <AnnouncementCard key={ann.id} announcement={ann} onResponse={loadData} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'passover' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Passover</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
              </div>
            ) : passovers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No passovers found</p>
            ) : (
              <div className="space-y-4">
                {passovers.map((passover) => (
                  <div key={passover.id} id={`passover-${passover.id}`}>
                    <PassoverBubble passover={passover} onResponse={loadData} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Response Modal Component
function ResponseModal({ 
  isOpen, 
  onClose, 
  onQuickResponse, 
  onCustomResponse, 
  responding,
  currentResponse 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onQuickResponse: (response: string) => void;
  onCustomResponse: (response: string) => void;
  responding: boolean;
  currentResponse?: string;
}) {
  const [customResponse, setCustomResponse] = useState('');

  // Pre-fill the response when editing
  useEffect(() => {
    if (isOpen && currentResponse) {
      setCustomResponse(currentResponse);
    } else if (isOpen && !currentResponse) {
      setCustomResponse('');
    }
  }, [isOpen, currentResponse]);

  if (!isOpen) return null;

  const handleQuickResponse = (response: string) => {
    onQuickResponse(response);
    setCustomResponse('');
  };

  const handleCustomSubmit = () => {
    if (customResponse.trim()) {
      onCustomResponse(customResponse.trim());
      setCustomResponse('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-slate-900">{currentResponse ? 'Edit Response' : 'Respond'}</h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Quick Responses
            </label>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleQuickResponse('supplied')}
                disabled={responding}
                className="flex-1 min-w-[100px] px-4 py-3 text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
              >
                Supplied
              </button>
              <button
                onClick={() => handleQuickResponse('received')}
                disabled={responding}
                className="flex-1 min-w-[100px] px-4 py-3 text-sm font-medium bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
              >
                Received
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Custom Response
            </label>
            <input
              type="text"
              value={customResponse}
              onChange={(e) => setCustomResponse(e.target.value)}
              placeholder="eg: Not supplied as pt currently discharged"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleCustomSubmit}
              disabled={responding || !customResponse.trim()}
              className="flex-1 px-4 py-3 text-sm font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              {currentResponse ? 'Update' : 'Submit'}
            </button>
            <button
              onClick={() => {
                onClose();
                setCustomResponse('');
              }}
              className="flex-1 px-4 py-3 text-sm font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Announcement Card Component
function AnnouncementCard({ announcement, onResponse }: { announcement: Announcement; onResponse?: () => void }) {
  const { user, isAdmin } = useAuth();
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [announcementData, setAnnouncementData] = useState(announcement);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleQuickResponse = async (response: string) => {
    if (!user) return;
    setResponding(true);
    try {
      await announcementApi.respondToAnnouncement(announcement.id, response);
      // Reload announcement to get updated responses
      const updated = await announcementApi.getAnnouncement(announcement.id);
      setAnnouncementData(updated);
      setShowResponseModal(false);
      if (onResponse) onResponse();
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setResponding(false);
    }
  };

  const handleCustomResponse = async (response: string) => {
    if (!user || !response.trim()) return;
    await handleQuickResponse(response);
  };

  const handleArchive = async () => {
    if (!isAdmin || !confirm('Are you sure you want to archive this announcement?')) return;
    setArchiving(true);
    try {
      await announcementApi.archiveAnnouncement(announcementData.id);
      if (onResponse) onResponse();
    } catch (error) {
      console.error('Failed to archive:', error);
      alert('Failed to archive announcement');
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await announcementApi.deleteAnnouncement(announcementData.id);
      if (onResponse) onResponse();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  const userResponse = announcementData.responses?.find(r => r.userId === user?.id);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAdmin) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAdmin || !isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Allow swiping left to open (0 to 120px)
    if (diff > 0 && diff <= 120) {
      setSwipeOffset(diff);
    }
    // Allow swiping right to close when already open
    else if (diff < 0 && swipeOffset > 0) {
      const newOffset = Math.max(0, swipeOffset + diff);
      setSwipeOffset(newOffset);
      setStartX(currentX); // Update start position for continuous tracking
    }
  };

  const handleTouchEnd = () => {
    if (!isAdmin) return;
    setIsDragging(false);
    if (swipeOffset > 60) {
      setSwipeOffset(120); // Snap to reveal
    } else {
      setSwipeOffset(0); // Snap back
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAdmin || !isDragging) return;
    const currentX = e.clientX;
    const diff = startX - currentX;
    
    // Allow swiping left to open (0 to 120px)
    if (diff > 0 && diff <= 120) {
      setSwipeOffset(diff);
    }
    // Allow swiping right to close when already open
    else if (diff < 0 && swipeOffset > 0) {
      const newOffset = Math.max(0, swipeOffset + diff);
      setSwipeOffset(newOffset);
      setStartX(currentX); // Update start position for continuous tracking
    }
  };

  const handleMouseUp = () => {
    if (!isAdmin) return;
    setIsDragging(false);
    if (swipeOffset > 60) {
      setSwipeOffset(120); // Snap to reveal
    } else {
      setSwipeOffset(0); // Snap back
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-indigo-400 transition-all">
      {/* Action buttons background */}
      {isAdmin && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 bg-gradient-to-l from-slate-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwipeOffset(0);
              handleArchive();
            }}
            disabled={archiving || deleting || !!announcementData.archivedAt}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-110 transition-transform"
            title="Archive"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwipeOffset(0);
              handleDelete();
            }}
            disabled={archiving || deleting}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-110 transition-transform"
            title="Delete"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Main card content */}
      <div 
        className="bg-white p-4 md:p-6 relative transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
      {/* Title Section */}
      <div className="flex flex-row items-start justify-between gap-2 mb-1">
        <h3 className="text-base text-lg font-bold break-words text-slate-900">{announcementData.title}</h3>
        {announcementData.isPinned && (
          <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-lg self-start shadow-sm">📌 Pinned</span>
        )}
      </div>

      {/* User, Category, Date Section */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mb-1">
        <span className="text-slate-900">{announcementData.author?.fullName}</span>
        <span className="text-slate-400">•</span>
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{announcementData.category?.name}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-500">{format(new Date(announcementData.createdAt), 'MMM d, yyyy HH:mm')}</span>
      </div>

      {/* Separator */}
      <div className="border-t-2 border-slate-100 mb-4"></div>

      {/* Content Section */}
      <div className="text-slate-700 mb-4">
        <RichTextDisplay text={announcementData.content} />
      </div>

      {/* Separator */}
      <div className="border-t-2 border-slate-100 mb-4"></div>
      
      {/* Response Section */}
      {user && (
        <div>
          {userResponse ? (
            // Show only current user's response with edit button
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-emerald-700">{user.fullName}:</span> {userResponse.response}
                <span className="ml-2 text-slate-500">
                  ({format(new Date(userResponse.createdAt), 'MMM d, HH:mm')})
                </span>
              </div>
              <button
                onClick={() => setShowResponseModal(true)}
                disabled={responding}
                className="px-4 py-2 text-sm font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 self-start sm:self-auto transition-colors"
              >
                Edit
              </button>
            </div>
          ) : (
            // Only show respond button if no other user has responded
            !announcementData.responses || announcementData.responses.length === 0 ? (
              <button
                onClick={() => setShowResponseModal(true)}
                disabled={responding}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
              >
                Respond
              </button>
            ) : null
          )}
        </div>
      )}

      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        onQuickResponse={handleQuickResponse}
        onCustomResponse={handleCustomResponse}
        responding={responding}
        currentResponse={userResponse?.response}
      />

      {/* Show all responses only if current user hasn't responded */}
      {!userResponse && announcementData.responses && announcementData.responses.length > 0 && (
        <div>
          <div className="space-y-2">
            {announcementData.responses.map((response) => (
              <div key={response.id} className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                <span className="font-semibold text-slate-900">{response.user?.fullName}:</span> {response.response}
                <span className="ml-2 text-slate-400 text-xs">
                  ({format(new Date(response.createdAt), 'MMM d, HH:mm')})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Image Modal Component
function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageAlt 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  imageAlt: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen w-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-screen object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        onClick={onClose}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Passover Bubble Component
function PassoverBubble({ passover, onResponse }: { passover: Passover; onResponse?: () => void }) {
  const { user, isAdmin } = useAuth();
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passoverData, setPassoverData] = useState(passover);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageAspectRatios, setImageAspectRatios] = useState<Map<number, number>>(new Map());

  // Handle image load to get aspect ratio
  const handleImageLoad = (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatios(prev => new Map(prev).set(index, aspectRatio));
  };

  // Handle image click - open in new tab
  const handleImageClick = (e: React.MouseEvent, imageUrl: string, imageAlt: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleQuickResponse = async (response: string) => {
    if (!user) return;
    setResponding(true);
    try {
      await passoverApi.respondToPassover(passover.id, response);
      // Reload passover to get updated responses
      const updated = await passoverApi.getPassover(passover.id);
      setPassoverData(updated);
      setShowResponseModal(false);
      if (onResponse) onResponse();
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setResponding(false);
    }
  };

  const handleCustomResponse = async (response: string) => {
    if (!user || !response.trim()) return;
    await handleQuickResponse(response);
  };

  const handleArchive = async () => {
    if (!isAdmin || !confirm('Are you sure you want to archive this passover?')) return;
    setArchiving(true);
    try {
      await passoverApi.archivePassover(passoverData.id);
      if (onResponse) onResponse();
    } catch (error) {
      console.error('Failed to archive:', error);
      alert('Failed to archive passover');
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !confirm('Are you sure you want to delete this passover? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await passoverApi.deletePassover(passoverData.id);
      if (onResponse) onResponse();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete passover');
    } finally {
      setDeleting(false);
    }
  };

  const userResponse = passoverData.responses?.find((r: any) => r.userId === user?.id);
  const contentText = typeof passoverData.content === 'string' 
    ? passoverData.content 
    : (passoverData.content?.text || JSON.stringify(passoverData.content, null, 2));
  
  // Check if passover has been responded to
  const hasResponses = passoverData.responses && passoverData.responses.length > 0;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAdmin) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAdmin || !isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Allow swiping left to open (0 to 120px)
    if (diff > 0 && diff <= 120) {
      setSwipeOffset(diff);
    }
    // Allow swiping right to close when already open
    else if (diff < 0 && swipeOffset > 0) {
      const newOffset = Math.max(0, swipeOffset + diff);
      setSwipeOffset(newOffset);
      setStartX(currentX); // Update start position for continuous tracking
    }
  };

  const handleTouchEnd = () => {
    if (!isAdmin) return;
    setIsDragging(false);
    if (swipeOffset > 60) {
      setSwipeOffset(120); // Snap to reveal
    } else {
      setSwipeOffset(0); // Snap back
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAdmin || !isDragging) return;
    const currentX = e.clientX;
    const diff = startX - currentX;
    
    // Allow swiping left to open (0 to 120px)
    if (diff > 0 && diff <= 120) {
      setSwipeOffset(diff);
    }
    // Allow swiping right to close when already open
    else if (diff < 0 && swipeOffset > 0) {
      const newOffset = Math.max(0, swipeOffset + diff);
      setSwipeOffset(newOffset);
      setStartX(currentX); // Update start position for continuous tracking
    }
  };

  const handleMouseUp = () => {
    if (!isAdmin) return;
    setIsDragging(false);
    if (swipeOffset > 60) {
      setSwipeOffset(120); // Snap to reveal
    } else {
      setSwipeOffset(0); // Snap back
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-md hover:shadow-xl border border hover:border-cyan-500 transition-all ${!hasResponses ? 'border-l-4 border-cyan-400' : 'border-gray-100'}`}>
      {/* Action buttons background */}
      {isAdmin && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 bg-gradient-to-l from-cyan-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwipeOffset(0);
              handleArchive();
            }}
            disabled={archiving || deleting || !!passoverData.archivedAt}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-110 transition-transform"
            title="Archive"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwipeOffset(0);
              handleDelete();
            }}
            disabled={archiving || deleting}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-110 transition-transform"
            title="Delete"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Main card content */}
      <div 
        className={`p-5 relative transition-transform duration-200 ease-out ${!hasResponses ? 'bg-gradient-to-br from-cyan-50 to-blue-50' : 'bg-white'}`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
      <div className="flex flex-row items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-cyan-900 break-words text-lg">Passover from {passoverData.outgoingUser?.fullName}</h3>
          <p className="text-sm text-cyan-700 font-medium mt-1">
            {passoverData.category?.name}
            {passoverData.group && (
              <span className="ml-2 text-cyan-600">
                → Group: {passoverData.group.name}
              </span>
            )}
            {passoverData.incomingUser && (
              <span className="ml-2 text-cyan-600">
                → To: {passoverData.incomingUser.fullName}
              </span>
            )}
          </p>
        </div>
        {!hasResponses && (
          <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg self-start shadow-sm">
            {passoverData.status}
          </span>
        )}
      </div>
      <div className="text-sm text-slate-700 mb-4 whitespace-pre-wrap">
        <RichTextDisplay text={contentText} />
      </div>

      {/* Attachments Section */}
      {passoverData.attachments && Array.isArray(passoverData.attachments) && passoverData.attachments.length > 0 && (
        <div className="mt-3 mb-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Attachments:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {passoverData.attachments.map((attachment: any, index: number) => {
              const isImage = attachment.mimetype?.startsWith('image/');
              const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
              const imageUrl = `${baseUrl}${attachment.path}`;
              const hasError = imageErrors.has(index);
              const aspectRatio = imageAspectRatios.get(index);
              
              return (
                <div key={index} className="relative group">
                  {isImage && !hasError ? (
                    <div
                      onClick={(e) => handleImageClick(e, imageUrl, attachment.originalName)}
                      className="block cursor-pointer"
                    >
                      <div 
                        className="w-full bg-gray-50 rounded border border-gray-300 hover:border-indigo-500 transition-colors overflow-hidden"
                        style={{
                          aspectRatio: aspectRatio ? `${aspectRatio} / 1` : '1 / 1',
                          minHeight: aspectRatio ? 'auto' : '96px'
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={attachment.originalName}
                          className="w-full h-full object-contain"
                          onLoad={(e) => handleImageLoad(index, e)}
                          onError={() => {
                            setImageErrors(prev => new Set(prev).add(index));
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded pointer-events-none"></div>
                    </div>
                  ) : (
                    <a 
                      href={`${baseUrl}${attachment.path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block h-24 bg-gray-100 border border-gray-300 rounded hover:border-indigo-500 transition-colors flex flex-col items-center justify-center p-2"
                    >
                      {isImage && hasError ? (
                        <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      <span className="text-xs text-gray-600 text-center truncate w-full">{attachment.originalName}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Response Section - for incoming user or group members */}
      {user && (
        passoverData.incomingUserId === user.id || 
        (passoverData.group && passoverData.group.users && 
         (passoverData.group as any).users.some((gu: any) => gu.user?.id === user.id || gu.userId === user.id))
      ) && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          {userResponse ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.fullName} :</span> {typeof userResponse.response === 'object' ? userResponse.response.text : userResponse.response}
                <span className="ml-2 text-gray-400">
                  ({format(new Date(userResponse.createdAt), 'MMM d, HH:mm')})
                </span>
              </div>
              <button
                onClick={() => setShowResponseModal(true)}
                disabled={responding}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 self-start sm:self-auto mr-4"
              >
                Edit
              </button>
            </div>
          ) : (
            // Only show respond button if no one has responded yet
            (!passoverData.responses || passoverData.responses.length === 0) && (
              <button
                onClick={() => setShowResponseModal(true)}
                disabled={responding}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Respond
              </button>
            )
          )}
        </div>
      )}

      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        onQuickResponse={handleQuickResponse}
        onCustomResponse={handleCustomResponse}
        responding={responding}
        currentResponse={typeof userResponse?.response === 'object' ? userResponse.response.text : userResponse?.response}
      />

      {/* Show responses from other users only (exclude current user's response) */}
      {passoverData.responses && passoverData.responses.length > 0 && (() => {
        const otherResponses = passoverData.responses.filter((response: any) => response.userId !== user?.id);
        if (otherResponses.length > 0) {
          return (
            <div>
              <div className="space-y-1">
                {otherResponses.map((response: any) => {
                  const responseText = typeof response.response === 'object' ? response.response.text : response.response;
                  return (
                    <div key={response.id} className="text-sm text-gray-600">
                      <span className="font-medium">{response.user?.fullName}:</span> {responseText}
                      <span className="ml-2 text-gray-400">
                        ({format(new Date(response.createdAt), 'MMM d, HH:mm')})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-slate-50">
        <MobileMenu />
        <Sidebar />
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
