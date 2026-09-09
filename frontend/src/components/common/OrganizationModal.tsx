import React, { useState } from 'react';
import { School, GraduationCap, Factory, Check, X, Building, Clock, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrganizationType } from '../../types';

export const OrganizationModal: React.FC = () => {
  const { organization, showOrgModal, setShowOrgModal, updateOrganization } = useApp();

  const [selectedType, setSelectedType] = useState<OrganizationType>(organization?.type || 'school');
  const [name, setName] = useState(organization?.name || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [contactEmail, setContactEmail] = useState(organization?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(organization?.contactPhone || '');
  const [startTime, setStartTime] = useState(organization?.workingHours?.start || '08:00');
  const [endTime, setEndTime] = useState(organization?.workingHours?.end || '16:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showOrgModal) return null;

  const handleTypeSelect = (type: OrganizationType) => {
    setSelectedType(type);
    if (type === 'school') {
      setName('School');
    } else if (type === 'college') {
      setName('College');
    } else {
      setName('Company');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateOrganization({
        name,
        type: selectedType,
        address,
        contactEmail,
        contactPhone,
        workingHours: { start: startTime, end: endTime },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timezone: 'UTC+05:30',
      });
    } catch (err) {
      console.error('Failed to update organization', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization Configuration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              StaffSync adapts its terminology, timetable, and algorithms to your operating model.
            </p>
          </div>
          {organization && (
            <button
              onClick={() => setShowOrgModal(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Select Category */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Organization Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* School */}
              <div
                onClick={() => handleTypeSelect('school')}
                className={`relative cursor-pointer rounded-xl border p-3.5 text-center transition-all ${
                  selectedType === 'school'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
                  <School className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900 dark:text-white">School</div>
                <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Classes, Periods, Faculty Proxies
                </div>
                {selectedType === 'school' && (
                  <span className="absolute right-2 top-2 rounded-full bg-indigo-600 p-0.5 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* College */}
              <div
                onClick={() => handleTypeSelect('college')}
                className={`relative cursor-pointer rounded-xl border p-3.5 text-center transition-all ${
                  selectedType === 'college'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900 dark:text-white">College</div>
                <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Depts, Semesters, Lecture Swaps
                </div>
                {selectedType === 'college' && (
                  <span className="absolute right-2 top-2 rounded-full bg-indigo-600 p-0.5 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* Industry */}
              <div
                onClick={() => handleTypeSelect('industry')}
                className={`relative cursor-pointer rounded-xl border p-3.5 text-center transition-all ${
                  selectedType === 'industry'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400">
                  <Factory className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900 dark:text-white">Industry</div>
                <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Shifts, Rota, Skills & Overtime
                </div>
                {selectedType === 'industry' && (
                  <span className="absolute right-2 top-2 rounded-full bg-indigo-600 p-0.5 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Org Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Organization Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Your Institution Name"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Address & Contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Campus Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@org.edu"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Daily Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Daily End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {organization && (
              <button
                type="button"
                onClick={() => setShowOrgModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Configuration...' : 'Save & Enter Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
