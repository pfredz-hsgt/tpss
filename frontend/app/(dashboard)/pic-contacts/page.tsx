'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import { temperatureApi, FridgeSection, PICContact } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Phone } from 'lucide-react';

export default function PICContactsPage() {
  const { isAdmin } = useAuth();
  const [sections, setSections] = useState<FridgeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingContact, setEditingContact] = useState<PICContact | null>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: '',
    phoneNumber: '',
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
      setError(err.message || 'Failed to load PIC contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (sectionId: string) => {
    if (!contactForm.name || !contactForm.phoneNumber) {
      setError('Name and phone number are required');
      return;
    }

    try {
      await temperatureApi.createPICContact({
        sectionId,
        name: contactForm.name,
        phoneNumber: contactForm.phoneNumber,
      });

      setSuccess('Contact added successfully!');
      setContactForm({ name: '', phoneNumber: '' });
      setAddingToSection(null);
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add contact');
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !contactForm.name || !contactForm.phoneNumber) {
      setError('Name and phone number are required');
      return;
    }

    try {
      await temperatureApi.updatePICContact(editingContact.id, {
        name: contactForm.name,
        phoneNumber: contactForm.phoneNumber,
      });

      setSuccess('Contact updated successfully!');
      setContactForm({ name: '', phoneNumber: '' });
      setEditingContact(null);
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await temperatureApi.deletePICContact(contactId);
      setSuccess('Contact deleted successfully!');
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
    }
  };

  const startEditContact = (contact: PICContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
    });
    setAddingToSection(null);
  };

  const startAddContact = (sectionId: string) => {
    setAddingToSection(sectionId);
    setContactForm({ name: '', phoneNumber: '' });
    setEditingContact(null);
  };

  const cancelEdit = () => {
    setEditingContact(null);
    setAddingToSection(null);
    setContactForm({ name: '', phoneNumber: '' });
  };

  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    // Remove all dashes and spaces
    let cleaned = phoneNumber.replace(/[- ]/g, '');
    
    // Handle Malaysian phone numbers: add +60 prefix and remove leading 0
    if (cleaned.startsWith('+60')) {
      // Already has +60, keep as is
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      // Starts with 0, replace with +60
      return '+60' + cleaned.substring(1);
    } else if (cleaned.startsWith('+6') && !cleaned.startsWith('+60')) {
      // Has +6 but not +60, ensure it's +60
      return '+60' + cleaned.substring(2);
    } else {
      // No prefix, add +60
      return '+60' + cleaned;
    }
  };

  const getWhatsAppUrl = (phoneNumber: string): string => {
    const formatted = formatPhoneForWhatsApp(phoneNumber);
    return `https://wa.me/${formatted.replace(/\+/g, '')}`;
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
      setEditingSectionId(null);
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update section name');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileMenu />
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              PIC Contact Numbers
            </h1>
            {editingMode && (
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                + Add Section
              </button>
            )}
          </div>

          {/* Editing Mode Toggle - Only show for admins */}
          {isAdmin && (
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-md p-4">
              <span className="text-sm font-semibold text-slate-700">Editing Mode:</span>
              <button
                onClick={() => {
                  setEditingMode(!editingMode);
                  // Cancel any ongoing edits when toggling off
                  if (editingMode) {
                    setEditingContact(null);
                    setAddingToSection(null);
                    setContactForm({ name: '', phoneNumber: '' });
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  editingMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editingMode ? 'translate-x-6' : 'translate-x-1'
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
          )}
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
            {sections
              .filter((section) => section.picContacts && section.picContacts.length > 0)
              .map((section) => (
              <div key={section.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {section.name}
                  </h2>
                  {editingMode && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateSectionName(section.id, section.name)}
                        className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Edit Section Name
                      </button>
                      <button
                        onClick={() => startAddContact(section.id)}
                        className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all"
                      >
                        + Add Contact
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Contact Form */}
                {addingToSection === section.id && (
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Add New Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number (e.g., +6013-7703295)"
                        value={contactForm.phoneNumber}
                        onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                        className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddContact(section.id)}
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

                {/* Contact List */}
                {section.picContacts && section.picContacts.length > 0 ? (
                  <div className="space-y-3">
                    {section.picContacts.map((contact) => (
                      <div key={contact.id}>
                        {editingContact?.id === contact.id ? (
                          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Edit Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <input
                                type="text"
                                placeholder="Name"
                                value={contactForm.name}
                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                              <input
                                type="text"
                                placeholder="Phone Number"
                                value={contactForm.phoneNumber}
                                onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                                className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateContact}
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
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{contact.name}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-slate-600">
                                  <a href={`tel:${contact.phoneNumber}`} className="hover:text-indigo-600 transition-colors">
                                    {contact.phoneNumber}
                                  </a>
                                </p>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${contact.phoneNumber}`}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md"
                                    title="Call"
                                  >
                                    <Phone className="w-4 h-4" />
                                    <span>Call</span>
                                  </a>
                                  <a
                                    href={getWhatsAppUrl(contact.phoneNumber)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md"
                                    title="WhatsApp"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    <span>WhatsApp</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                            {editingMode && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditContact(contact)}
                                  className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteContact(contact.id)}
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
                      ? 'No contacts in this section. Click "Add Contact" to add one.'
                      : 'No contacts in this section.'
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

