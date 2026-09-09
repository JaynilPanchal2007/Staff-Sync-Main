import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Briefcase,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StaffMember } from '../types';

export const StaffPage: React.FC = () => {
  const { orgType, refreshKey, triggerRefresh, showToast } = useApp();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewStaff, setViewStaff] = useState<StaffMember | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [role, setRole] = useState('Assistant Professor');
  const [subjectsOrSkills, setSubjectsOrSkills] = useState('Data Structures, Algorithms');
  const [qualification, setQualification] = useState('M.Tech / Ph.D');
  const [experience, setExperience] = useState('4');
  const [maxWorkload, setMaxWorkload] = useState(18);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIndustry = orgType === 'industry';

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      const data = await api.getStaff({
        q: searchQuery,
        department: selectedDept !== 'all' ? selectedDept : undefined,
      });
      setStaffList(data.staff || []);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [refreshKey, selectedDept]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStaff();
  };

  const openAddStaffModal = () => {
    setEditingStaff(null);
    resetForm();
    setShowAddModal(true);
  };

  const openEditStaffModal = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name || '');
    setEmployeeId(member.employeeId || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setDepartment(member.department || '');
    setRole(member.role || '');
    setSubjectsOrSkills((isIndustry ? member.skills : member.subjects)?.join(', ') || '');
    setQualification(member.qualification || '');
    setExperience(member.experience || '');
    setMaxWorkload(member.maxWorkload || 18);
    setStatus(member.status || 'active');
    setModalError(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError('Please enter a valid staff or faculty name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = subjectsOrSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const generatedId = employeeId.trim() || `FAC-${Math.floor(100 + Math.random() * 900)}`;

      const payload = {
        name: name.trim(),
        employeeId: generatedId,
        email: email.trim(),
        phone: phone.trim(),
        department: department.trim() || (isIndustry ? 'Production' : 'General'),
        role: role.trim() || (isIndustry ? 'Technician' : 'Faculty Member'),
        subjects: isIndustry ? [] : items,
        skills: isIndustry ? items : [],
        qualification: qualification.trim() || 'Degree / Cert',
        experience: experience.trim() || '2',
        maxWorkload: Number(maxWorkload) || 18,
        status,
      };

      if (editingStaff) {
        await api.updateStaff(editingStaff.id, payload);
        showToast(`Updated ${name.trim()} successfully!`, 'success');
      } else {
        await api.addStaff(payload);
        showToast(`Added ${name.trim()} successfully!`, 'success');
      }

      setShowAddModal(false);
      setEditingStaff(null);
      resetForm();
      triggerRefresh();
    } catch (err) {
      const msg = (err as Error).message || 'Failed to save staff member.';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, staffName: string) => {
    try {
      await api.deleteStaff(id);
      showToast(`Removed ${staffName} from database.`, 'info');
      setDeleteConfirmId(null);
      triggerRefresh();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setEmployeeId(`FAC-${Math.floor(100 + Math.random() * 900)}`);
    setEmail('');
    setPhone('');
    setDepartment(isIndustry ? 'Assembly' : 'Computer Science');
    setRole(isIndustry ? 'Technician' : 'Assistant Professor');
    setSubjectsOrSkills('Data Structures, Algorithms');
    setQualification('M.Tech / Ph.D');
    setExperience('3');
    setMaxWorkload(18);
    setStatus('active');
    setModalError(null);
  };

  const departments = Array.from(new Set(staffList.map((s) => s.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isIndustry ? 'Workforce & Employee Directory' : 'Faculty & Staff Directory'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {staffList.length} registered personnel in database. Click any member to inspect personal view.
          </p>
        </div>

        <button
          onClick={openAddStaffModal}
          className="flex items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add {isIndustry ? 'Employee' : 'Faculty Member'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by name, ID, ${isIndustry ? 'skill' : 'subject'}...`}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {staffList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
              No {isIndustry ? 'employees' : 'faculty'} found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery ? 'Try clearing your search query or department filter.' : 'Add your first staff member.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">{isIndustry ? 'Skills' : 'Specialization'}</th>
                  <th className="px-4 py-3">Workload</th>
                  <th className="px-4 py-3">Proxies</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffList.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                          <div className="text-[11px] font-medium text-slate-400">{member.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                      {member.department}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                      {member.role}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(isIndustry ? member.skills : member.subjects)?.slice(0, 2).map((item, i) => (
                          <span
                            key={i}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {member.assignedLectures || member.weeklyHours || 0}
                      </div>
                      <div className="text-[10px] text-slate-400">of {member.maxWorkload || 18} max</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                        {member.proxyCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditStaffModal(member)}
                          className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                          title="Edit member details"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <Link
                          to={isIndustry ? `/employee/${member.id}` : `/faculty/${member.id}`}
                          className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          title="Open personal dashboard view"
                        >
                          <span>Personal View</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Delete staff member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingStaff ? `Edit ${isIndustry ? 'Employee' : 'Faculty'} Details` : `Add New ${isIndustry ? 'Employee' : 'Faculty Member'}`}
                </h2>
                <p className="text-[11px] text-slate-500">Auto-validates duplicate ID & generates employee profile.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStaff(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {modalError && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1 font-medium">{modalError}</div>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Faculty Name"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Employee ID
                    </label>
                    <button
                      type="button"
                      onClick={() => setEmployeeId(`FAC-${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[10px] text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Generate ID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. FAC-104"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Department *</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['CS', 'IT', 'ECE', 'Math'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDepartment(d === 'CS' ? 'Computer Science' : d === 'IT' ? 'Information Tech' : d === 'ECE' ? 'Electronics' : 'Mathematics')}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Role / Title *</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={isIndustry ? 'e.g. Line Lead' : 'e.g. Associate Professor'}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['Professor', 'Assoc. Prof', 'Asst. Prof', 'Lecturer'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r === 'Assoc. Prof' ? 'Associate Professor' : r === 'Asst. Prof' ? 'Assistant Professor' : r)}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isIndustry ? 'Skills (comma separated)' : 'Subjects (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={subjectsOrSkills}
                    onChange={(e) => setSubjectsOrSkills(e.target.value)}
                    placeholder={isIndustry ? 'CNC, Quality, OSHA' : 'Math, Data Structures'}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Experience (Years)
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Workload / Cap
                  </label>
                  <input
                    type="number"
                    value={maxWorkload}
                    onChange={(e) => setMaxWorkload(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Auto-generated if left blank"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {editingStaff && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStaff(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingStaff ? 'Update Member' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
