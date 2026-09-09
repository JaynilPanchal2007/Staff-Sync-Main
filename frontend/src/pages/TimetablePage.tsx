import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Clock,
  BookOpen,
  MapPin,
  X,
  Layers,
  CheckCircle2,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TimetableEntry, StaffMember } from '../types';

export const TimetablePage: React.FC = () => {
  const { refreshKey, triggerRefresh, showToast } = useApp();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add Lecture form state
  const [assignMode, setAssignMode] = useState<'existing' | 'custom' | 'unassigned'>('existing');
  const [facultyId, setFacultyId] = useState('');
  const [customFacultyName, setCustomFacultyName] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('Hall A');
  const [classGrade, setClassGrade] = useState('Year 2');
  const [section, setSection] = useState('A');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ttRes, staffRes] = await Promise.all([
        api.getTimetable(),
        api.getStaff(),
      ]);
      setTimetable(ttRes.timetable || []);
      const staffs = staffRes.staff || [];
      setStaffList(staffs);

      if (staffs.length > 0) {
        if (!facultyId || !staffs.some((s) => s.id === facultyId)) {
          setFacultyId(staffs[0].id);
        }
        setAssignMode('existing');
      } else {
        setAssignMode('custom');
        setCustomFacultyName('');
      }
    } catch (err) {
      console.error('Failed to load timetable data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleQuickTime = (slot: string) => {
    const [start, end] = slot.split(' - ');
    if (start && end) {
      setStartTime(start.trim());
      setEndTime(end.trim());
    }
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setModalError(null);
    setSubject('Data Structures & Algorithms');
    setDay(selectedDay || 'Monday');
    setStartTime('09:00');
    setEndTime('10:00');
    setRoom('Hall A');
    setClassGrade('Year 2');
    setSection('A');
    if (staffList.length === 0) {
      setAssignMode('custom');
      setCustomFacultyName('');
    } else {
      setAssignMode('existing');
      setFacultyId(staffList[0].id);
    }
    setShowAddModal(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setModalError(null);
    setSubject(entry.subject || '');
    setDay(entry.day || 'Monday');
    setStartTime(entry.startTime || '09:00');
    setEndTime(entry.endTime || '10:00');
    setRoom(entry.room || 'Hall A');
    setClassGrade(entry.classGrade || 'Year 2');
    setSection(entry.section || 'A');

    if (entry.facultyId === 'unassigned' || !entry.facultyId) {
      if (entry.facultyName && entry.facultyName !== 'Unassigned / TBA') {
        setAssignMode('custom');
        setCustomFacultyName(entry.facultyName);
      } else {
        setAssignMode('unassigned');
      }
    } else {
      const match = staffList.find((s) => s.id === entry.facultyId);
      if (match) {
        setAssignMode('existing');
        setFacultyId(match.id);
      } else {
        setAssignMode('custom');
        setCustomFacultyName(entry.facultyName || '');
      }
    }

    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!subject.trim()) {
      setModalError('Please enter a subject or course name.');
      return;
    }

    if (startTime >= endTime) {
      setModalError('End time must be later than start time.');
      return;
    }

    if (assignMode === 'custom' && !customFacultyName.trim()) {
      setModalError('Please type a faculty name or switch to Unassigned slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      let assignedFid = facultyId;
      let assignedFname = '';

      if (assignMode === 'unassigned') {
        assignedFid = 'unassigned';
        assignedFname = 'Unassigned / TBA';
      } else if (assignMode === 'custom') {
        assignedFid = '';
        assignedFname = customFacultyName.trim();
      } else {
        const selectedStaff = staffList.find((s) => s.id === facultyId);
        assignedFname = selectedStaff?.name || 'Faculty Member';
      }

      const payload = {
        facultyId: assignedFid,
        facultyName: assignedFname,
        subject: subject.trim(),
        day,
        startTime,
        endTime,
        room: room.trim() || 'Hall A',
        classGrade: classGrade.trim() || 'Year 1',
        section: section.trim() || 'A',
      };

      if (editingEntry) {
        await api.updateTimetableEntry(editingEntry.id, payload);
        showToast(`Lecture "${subject.trim()}" updated successfully!`, 'success');
      } else {
        await api.addTimetableEntry(payload);
        showToast(`Lecture "${subject.trim()}" scheduled for ${day}!`, 'success');
      }

      setShowAddModal(false);
      setEditingEntry(null);
      triggerRefresh();
    } catch (err) {
      setModalError((err as Error).message || 'Failed to save lecture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTimetableEntry(id);
      showToast('Lecture deleted from schedule.', 'info');
      setDeleteConfirmId(null);
      triggerRefresh();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const dayEntries = timetable
    .filter((t) => t.day.toLowerCase() === selectedDay.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Academic Timetable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weekly lecture schedules with automated conflict prevention and faculty workload synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lecture</span>
          </button>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedDay === d
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {d}
            <span
              className={`ml-2 rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedDay === d
                  ? 'bg-indigo-500/50 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {timetable.filter((t) => t.day.toLowerCase() === d.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {/* Lectures Grid for Selected Day */}
      {dayEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            No lectures scheduled for {selectedDay}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Click 'Add Lecture' above to schedule a lecture for {selectedDay}.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setModalError(null);
                setShowAddModal(true);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Add Lecture Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dayEntries.map((entry) => (
            <div
              key={entry.id}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {entry.startTime} - {entry.endTime}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="rounded-md p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40"
                    title="Edit lecture details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  {deleteConfirmId === entry.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      title="Remove lecture"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{entry.subject}</h3>

              <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-slate-400">Faculty:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {entry.facultyName || 'Unassigned / Open'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {entry.room || 'Room TBA'}
                  </span>
                  <span>Class: {entry.classGrade} ({entry.section})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Lecture Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEntry ? 'Edit Lecture Details' : 'Schedule New Lecture'}
                </h2>
                <p className="text-[11px] text-slate-500">Automated conflict detection for faculty & rooms</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{modalError}</div>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              {/* Faculty Assignment Mode Switcher */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Faculty Member *
                  </label>
                  <div className="flex gap-1">
                    {staffList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAssignMode('existing')}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          assignMode === 'existing'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        From List
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAssignMode('custom')}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        assignMode === 'custom'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      + Type Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode('unassigned')}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        assignMode === 'unassigned'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Unassigned Slot
                    </button>
                  </div>
                </div>

                {assignMode === 'existing' && staffList.length > 0 && (
                  <select
                    required
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department} • {s.employeeId})
                      </option>
                    ))}
                  </select>
                )}

                {assignMode === 'custom' && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      required
                      value={customFacultyName}
                      onChange={(e) => setCustomFacultyName(e.target.value)}
                      placeholder="e.g. Faculty Name"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      If not already in staff directory, this will auto-register them as a faculty member.
                    </p>
                  </div>
                )}

                {assignMode === 'unassigned' && (
                  <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                    This lecture will be scheduled as an open slot. You can assign faculty later or use the Smart Replacement module.
                  </div>
                )}
              </div>

              {/* Subject / Course */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject / Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {['Data Structures', 'Operating Systems', 'DBMS', 'Networks', 'Machine Learning'].map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSubject(subj)}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day & Quick Time Selection */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Day *</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Quick Preset Slots */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Quick Slots:</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {['09:00 - 10:00', '10:15 - 11:15', '11:30 - 12:30', '14:00 - 15:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleQuickTime(slot)}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room, Grade, Section */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Room / Hall</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Hall A"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Grade / Year</label>
                  <input
                    type="text"
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    placeholder="Year 2"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Checking Conflicts...' : editingEntry ? 'Update Lecture' : 'Save Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
