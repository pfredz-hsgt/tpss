'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { temperatureApi, FridgeSection, Fridge } from '@/lib/api';

export default function ManageFridgesPage() {
  const [sections, setSections] = useState<FridgeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingFridge, setEditingFridge] = useState<Fridge | null>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState(false);

  const [fridgeForm, setFridgeForm] = useState({
    name: '',
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await temperatureApi.getFridgeSections();
      setSections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load fridge sections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    const sectionName = prompt('Enter new section name:');
    if (!sectionName) return;

    try {
      await temperatureApi.createFridgeSection({ name: sectionName });
      setSuccess('Section added successfully!');
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add section');
    }
  };

  const handleUpdateSectionName = async (sectionId: string, currentName: string) => {
    const newName = prompt('Enter new section name:', currentName);
    if (!newName || newName === currentName) return;

    try {
      await temperatureApi.updateFridgeSection(sectionId, { name: newName });
      setSuccess('Section name updated successfully!');
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update section name');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section? All fridges in this section will also be deleted.')) return;

    try {
      await temperatureApi.deleteFridgeSection(sectionId);
      setSuccess('Section deleted successfully!');
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete section');
    }
  };

  const handleAddFridge = async (sectionId: string) => {
    if (!fridgeForm.name) {
      setError('Fridge name is required');
      return;
    }

    try {
      await temperatureApi.createFridge({
        sectionId,
        name: fridgeForm.name,
      });

      setSuccess('Fridge added successfully!');
      setFridgeForm({ name: '' });
      setAddingToSection(null);
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add fridge');
    }
  };

  const handleUpdateFridge = async () => {
    if (!editingFridge || !fridgeForm.name) {
      setError('Fridge name is required');
      return;
    }

    try {
      await temperatureApi.updateFridge(editingFridge.id, {
        name: fridgeForm.name,
      });

      setSuccess('Fridge updated successfully!');
      setFridgeForm({ name: '' });
      setEditingFridge(null);
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update fridge');
    }
  };

  const handleDeleteFridge = async (fridgeId: string) => {
    if (!confirm('Are you sure you want to delete this fridge?')) return;

    try {
      await temperatureApi.deleteFridge(fridgeId);
      setSuccess('Fridge deleted successfully!');
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete fridge');
    }
  };

  const startEditFridge = (fridge: Fridge) => {
    setEditingFridge(fridge);
    setFridgeForm({ name: fridge.name });
    setAddingToSection(null);
  };

  const startAddFridge = (sectionId: string) => {
    setAddingToSection(sectionId);
    setFridgeForm({ name: '' });
    setEditingFridge(null);
  };

  const cancelEdit = () => {
    setEditingFridge(null);
    setAddingToSection(null);
    setFridgeForm({ name: '' });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 p-4 md:p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="pl-12 md:pl-1">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Manage Fridges
              </h1></div>
            {editingMode && (
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                + Add Section
              </button>
            )}
          </div>

          {/* Editing Mode Toggle */}
          <div className="flex items-center gap-3 bg-white rounded-lg shadow-md p-4">
            <span className="text-sm font-semibold text-slate-700">Editing Mode:</span>
            <button
              onClick={() => {
                setEditingMode(!editingMode);
                // Cancel any ongoing edits when toggling off
                if (editingMode) {
                  setEditingFridge(null);
                  setAddingToSection(null);
                  setFridgeForm({ name: '' });
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${editingMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm font-medium ${editingMode ? 'text-indigo-600' : 'text-slate-500'}`}>
              {editingMode ? 'ON' : 'OFF'}
            </span>
            <span className="text-xs text-slate-500 ml-2">
              ({editingMode ? 'Show' : 'Hide'} editing controls)
            </span>
          </div>
        </div>

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

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-slate-500 mb-4">No sections configured yet.</p>
            {editingMode && (
              <button
                onClick={handleAddSection}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Add First Section
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {section.name}
                  </h2>
                  {editingMode && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateSectionName(section.id, section.name)}
                        className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Edit Name
                      </button>
                      <button
                        onClick={() => startAddFridge(section.id)}
                        className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all"
                      >
                        + Add Fridge
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete Section
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Fridge Form */}
                {addingToSection === section.id && (
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Add New Fridge</h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Fridge name (e.g., Fridge 01)"
                        value={fridgeForm.name}
                        onChange={(e) => setFridgeForm({ name: e.target.value })}
                        className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleAddFridge(section.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Fridge List */}
                {section.fridges && section.fridges.length > 0 ? (
                  <div className="space-y-3">
                    {section.fridges.map((fridge) => (
                      <div key={fridge.id}>
                        {editingFridge?.id === fridge.id ? (
                          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Edit Fridge</h3>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                placeholder="Fridge name"
                                value={fridgeForm.name}
                                onChange={(e) => setFridgeForm({ name: e.target.value })}
                                className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                              <button
                                onClick={handleUpdateFridge}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                              >
                                Update
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="font-medium text-slate-800">{fridge.name}</div>
                            {editingMode && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditFridge(fridge)}
                                  className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFridge(fridge.id)}
                                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    {editingMode
                      ? 'No fridges in this section. Click "Add Fridge" to add one.'
                      : 'No fridges in this section.'
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

