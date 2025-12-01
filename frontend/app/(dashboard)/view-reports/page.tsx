'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { temperatureApi, TemperatureReport } from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';

export default function ViewReportsPage() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<TemperatureReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState(formatLocalDate(new Date()));
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate && endDate) {
      loadReports();
    }
  }, [selectedDate, endDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      // Load reports for date range - fetch all reports between start and end date
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Fetch reports for each date in the range
      const allReports: TemperatureReport[] = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = formatLocalDate(currentDate);
        try {
          const data = await temperatureApi.getTemperatureReports({ date: dateStr });
          allReports.push(...data);
        } catch (err) {
          // Continue if a date fails
          console.error(`Failed to load reports for ${dateStr}:`, err);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setReports(allReports);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await temperatureApi.deleteTemperatureReport(reportId);
      setSuccess('Report deleted successfully!');
      loadReports();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete report');
    }
  };

  const toggleExpandReport = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const getTimeLabel = (time: string) => {
    const timeMap: Record<string, string> = {
      '12am': '12:00 AM',
      '2am': '02:00 AM',
      '4am': '04:00 AM',
      '6am': '06:00 AM',
    };
    return timeMap[time] || time;
  };

  // Group reports by time for better organization
  const reportsByTime = reports.reduce((acc, report) => {
    if (!acc[report.time]) {
      acc[report.time] = [];
    }
    acc[report.time].push(report);
    return acc;
  }, {} as Record<string, TemperatureReport[]>);

  const timeOrder = ['12am', '2am', '4am', '6am'];

  const exportToExcel = () => {
    // Create a workbook structure
    const headers = ['Date', 'Time', 'Submitted By', 'Remarks', 'Section', 'Fridge Name', 'Temperature In Range'];
    const rows: any[] = [];

    reports.forEach((report) => {
      const reportDate = format(new Date(report.createdAt), 'yyyy-MM-dd');
      const reportTime = getTimeLabel(report.time);
      const submitter = report.submitter?.fullName || 'Unknown';
      const remarks = report.remarks || '';

      if (report.entries && report.entries.length > 0) {
        report.entries.forEach((entry) => {
          const section = entry.fridge?.section?.name || 'Unknown';
          const fridgeName = entry.fridge?.name || 'Unknown';
          const inRange = entry.temperatureInRange ? 'Yes' : 'No';

          rows.push([
            reportDate,
            reportTime,
            submitter,
            remarks,
            section,
            fridgeName,
            inRange,
          ]);
        });
      } else {
        // If no entries, still add a row for the report
        rows.push([
          reportDate,
          reportTime,
          submitter,
          remarks,
          '',
          '',
          '',
        ]);
      }
    });

    // Convert to CSV format (Excel can open CSV)
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `temperature-reports-${selectedDate}${endDate !== selectedDate ? `-to-${endDate}` : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 p-4 md:p-8">
        <div className="pl-12 md:pl-1">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            View Temperature Reports
          </h1> </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
            <span className="font-medium">{error}</span>
            <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4 border-emerald-500 text-emerald-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Date Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Start Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 sm:flex-none sm:w-64 px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <label className="text-sm font-semibold text-slate-700">
                End Date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={selectedDate}
                className="flex-1 sm:flex-none sm:w-64 px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => {
                  const today = formatLocalDate(new Date());
                  setSelectedDate(today);
                  setEndDate(today);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium transition-colors"
              >
                Today
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 text-sm font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Reports Display */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-slate-500">No reports found for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-slate-600 mb-4">
              Showing {reports.length} report{reports.length !== 1 ? 's' : ''} for {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </div>

            {timeOrder.map((time) => {
              const timeReports = reportsByTime[time];
              if (!timeReports || timeReports.length === 0) return null;

              return (
                <div key={time} className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
                    {getTimeLabel(time)}
                  </h2>

                  <div className="space-y-4">
                    {timeReports.map((report) => (
                      <div key={report.id} className="border-2 border-slate-200 rounded-lg overflow-hidden">
                        {/* Report Header */}
                        <div
                          className="bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleExpandReport(report.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-semibold text-slate-700">
                                  Submitted by: {report.submitter?.fullName || 'Unknown'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                                </span>
                              </div>

                              {report.remarks && (
                                <div className="text-sm text-slate-600">
                                  <span className="font-medium">Remarks:</span> {report.remarks}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteReport(report.id);
                                  }}
                                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                              <svg
                                className={`w-5 h-5 text-slate-500 transition-transform ${expandedReportId === report.id ? 'transform rotate-180' : ''
                                  }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Report Details (Expandable) */}
                        {expandedReportId === report.id && report.entries && (
                          <div className="p-4 bg-white border-t-2 border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Fridge Status Details</h3>

                            {/* Group entries by section */}
                            {(() => {
                              const entriesBySection: Record<string, typeof report.entries> = {};
                              report.entries?.forEach((entry) => {
                                const sectionName = entry.fridge?.section?.name || 'Unknown Section';
                                if (!entriesBySection[sectionName]) {
                                  entriesBySection[sectionName] = [];
                                }
                                entriesBySection[sectionName].push(entry);
                              });

                              return (
                                <div className="space-y-4">
                                  {Object.entries(entriesBySection).map(([sectionName, sectionEntries]) => (
                                    <div key={sectionName} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                      <h4 className="font-semibold text-slate-800 mb-3">{sectionName}</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {sectionEntries.map((entry) => (
                                          <div
                                            key={entry.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${entry.temperatureInRange
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-red-100 text-red-800'
                                              }`}
                                          >
                                            <span className="text-lg">
                                              {entry.temperatureInRange ? '✓' : '✗'}
                                            </span>
                                            <span className="text-sm font-medium">
                                              {entry.fridge?.name || 'Unknown Fridge'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

                            {/* Summary Statistics */}
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-emerald-50 rounded-lg p-3">
                                  <div className="text-2xl font-bold text-emerald-700">
                                    {report.entries?.filter((e) => e.temperatureInRange).length || 0}
                                  </div>
                                  <div className="text-xs text-emerald-600 font-medium">In Range</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3">
                                  <div className="text-2xl font-bold text-red-700">
                                    {report.entries?.filter((e) => !e.temperatureInRange).length || 0}
                                  </div>
                                  <div className="text-xs text-red-600 font-medium">Requires Attention</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

