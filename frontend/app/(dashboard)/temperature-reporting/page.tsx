'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import { temperatureApi, FridgeSection } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function TemperatureReportingPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<FridgeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: formatLocalDate(new Date()),
    time: '',
    remarks: '',
    checkedFridges: {} as Record<string, boolean>,
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await temperatureApi.getFridgeSections();
      setSections(data);

      // Initialize all fridges as checked
      const initialChecked: Record<string, boolean> = {};
      data.forEach((section) => {
        section.fridges?.forEach((fridge) => {
          initialChecked[fridge.id] = true;
        });
      });
      setFormData((prev) => ({ ...prev, checkedFridges: initialChecked }));
    } catch (err: any) {
      setError(err.message || 'Failed to load fridge sections');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (fridgeId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      checkedFridges: {
        ...prev.checkedFridges,
        [fridgeId]: checked,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Build entries array
      const entries = Object.entries(formData.checkedFridges).map(([fridgeId, temperatureInRange]) => ({
        fridgeId,
        temperatureInRange,
      }));

      await temperatureApi.createTemperatureReport({
        date: formData.date,
        time: formData.time,
        remarks: formData.remarks || undefined,
        entries,
      });

      setSuccess('Temperature report submitted successfully!');
      
      // Reset form - reset all fridges to checked (temperature in range)
      const resetChecked: Record<string, boolean> = {};
      sections.forEach((section) => {
        section.fridges?.forEach((fridge) => {
          resetChecked[fridge.id] = true;
        });
      });

      setFormData({
        date: formatLocalDate(new Date()),
        time: '',
        remarks: '',
        checkedFridges: resetChecked,
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit temperature report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileMenu />
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-8">
      <div className="pl-12 md:pl-1">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Temperature Reporting
        </h1>
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

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-4xl">
            <div className="space-y-6">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Time *
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  >
                    <option value="">Select time slot</option>
                    <option value="12am">12:00 AM</option>
                    <option value="2am">02:00 AM</option>
                    <option value="4am">04:00 AM</option>
                    <option value="6am">06:00 AM</option>
                  </select>
                </div>
              </div>

              {/* Fridge Sections */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b-2 border-slate-200 pb-2">
                  Fridge Temperature Status
                </h2>

                {sections.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No fridge sections configured. Please go to "Manage Fridge" to add sections and fridges.
                  </div>
                ) : (
                  sections.map((section) => (
                    <div key={section.id} className="border-2 border-slate-200 rounded-lg p-5 bg-slate-50">
                      <h3 className="text-base font-semibold text-slate-800 mb-4">
                        {section.name}
                      </h3>
                      
                      {section.fridges && section.fridges.length > 0 ? (
                        <div className="space-y-3">
                          {section.fridges.map((fridge) => (
                            <div key={fridge.id} className="flex items-center">
                              <label className="flex items-center cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={formData.checkedFridges[fridge.id] || false}
                                  onChange={(e) => handleCheckboxChange(fridge.id, e.target.checked)}
                                  className="w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="ml-3 text-slate-700 group-hover:text-slate-900 font-medium">
                                  {fridge.name}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          No fridges in this section
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={4}
                  placeholder="Enter any additional findings or issues..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || sections.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

