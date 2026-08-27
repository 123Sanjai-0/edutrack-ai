"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Plus,
  X,
  CheckCircle2,
  Edit2,
  Trash2,
  Layers,
  Search,
  Check,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminFacultyPage() {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);

  // Add Faculty Form
  const [addFormData, setAddFormData] = useState({
    faculty_id: "",
    full_name: "",
    email: "",
    username: "",
    password: "Faculty@123",
    phone: "+1 (555) 018-4491",
    department_id: 1,
    designation: "Associate Professor",
    qualification: "Ph.D. / M.Tech",
    specialization: "Algorithms & Distributed Systems",
  });

  // Edit Faculty Form
  const [editFormData, setEditFormData] = useState({
    id: 0,
    full_name: "",
    email: "",
    phone: "",
    department_id: 1,
    designation: "",
    qualification: "",
    specialization: "",
  });

  // Assign Subject Form
  const [assignFormData, setAssignFormData] = useState({
    subject_id: 1,
    class_section_id: 1,
    academic_year: "2025-2026",
  });

  const [submitting, setSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api.academics.getDepartments(),
      api.academics.getClasses(),
      api.academics.getSubjects(),
    ]).then(([d, c, s]) => {
      setDepartments(d || []);
      setClasses(c || []);
      setSubjects(s || []);
    });
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [departmentId]);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const data = await api.faculty.list(departmentId ? Number(departmentId) : undefined);
      setFacultyList(data || []);
    } catch (err) {
      console.error("Failed to load faculty", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.faculty.create({
        ...addFormData,
        department_id: Number(addFormData.department_id),
      });
      setShowAddModal(false);
      setNotificationMsg(`Faculty member ${addFormData.full_name} (${addFormData.faculty_id}) registered successfully!`);
      loadFaculty();
    } catch (err: any) {
      alert(err.message || "Failed to create faculty");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (fac: any) => {
    setSelectedFaculty(fac);
    setEditFormData({
      id: fac.id,
      full_name: fac.full_name,
      email: fac.email,
      phone: fac.phone || "",
      department_id: fac.department_id || 1,
      designation: fac.designation || "Associate Professor",
      qualification: fac.qualification || "Ph.D.",
      specialization: fac.specialization || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.faculty.update(editFormData.id, {
        full_name: editFormData.full_name,
        email: editFormData.email,
        phone: editFormData.phone,
        department_id: Number(editFormData.department_id),
        designation: editFormData.designation,
        qualification: editFormData.qualification,
        specialization: editFormData.specialization,
      });
      setShowEditModal(false);
      setNotificationMsg(`Faculty record for ${editFormData.full_name} updated successfully.`);
      loadFaculty();
    } catch (err: any) {
      alert(err.message || "Failed to update faculty");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove faculty member "${name}"?`)) {
      try {
        await api.faculty.delete(id);
        setNotificationMsg(`Faculty record "${name}" deleted.`);
        loadFaculty();
      } catch (err: any) {
        alert(err.message || "Delete failed");
      }
    }
  };

  const handleOpenAssign = (fac: any) => {
    setSelectedFaculty(fac);
    setAssignFormData({
      subject_id: subjects[0]?.id || 1,
      class_section_id: classes[0]?.id || 1,
      academic_year: "2025-2026",
    });
    setShowAssignModal(true);
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setSubmitting(true);
    try {
      await api.faculty.assignSubject(selectedFaculty.id, {
        subject_id: Number(assignFormData.subject_id),
        class_section_id: Number(assignFormData.class_section_id),
        academic_year: assignFormData.academic_year,
      });
      setNotificationMsg(`Assigned course/class successfully to ${selectedFaculty.full_name}!`);
      setShowAssignModal(false);
      loadFaculty();
    } catch (err: any) {
      alert(err.message || "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      await api.faculty.removeAssignment(assignmentId);
      setNotificationMsg("Assignment unlinked successfully.");
      loadFaculty();
    } catch (err: any) {
      alert(err.message || "Failed to remove assignment");
    }
  };

  const filteredFaculty = facultyList.filter((fac) => {
    const term = search.toLowerCase();
    return (
      fac.full_name?.toLowerCase().includes(term) ||
      fac.faculty_id?.toLowerCase().includes(term) ||
      fac.email?.toLowerCase().includes(term) ||
      fac.department_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-500" />
            Faculty & Academic Staff Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Departmental professors, course instructors, and classroom teaching assignments ({facultyList.length} Total)
          </p>
        </div>

        <button
          onClick={() => {
            setAddFormData({
              faculty_id: `FAC${Math.floor(100 + Math.random() * 900)}`,
              full_name: "",
              email: "",
              username: "",
              password: "Faculty@123",
              phone: "+1 (555) 018-4491",
              department_id: departments[0]?.id || 1,
              designation: "Associate Professor",
              qualification: "Ph.D. / M.Tech",
              specialization: "Database Systems & Machine Learning",
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Faculty Member
        </button>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-500 text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg("")} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, ID, or email..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-medium w-full md:w-auto"
        >
          <option value="">All Academic Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} - {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          No faculty members matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFaculty.map((fac) => (
            <div
              key={fac.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-5"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {fac.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{fac.full_name}</h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{fac.designation}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {fac.faculty_id} • {fac.department_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {fac.qualification}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{fac.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{fac.phone || "+1 (555) 018-4491"}</span>
                  </div>
                  {fac.specialization && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>Specialization: <b>{fac.specialization}</b></span>
                    </div>
                  )}
                </div>

                {/* Assigned Courses & Sections */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Courses & Classes:</span>
                    <button
                      onClick={() => handleOpenAssign(fac)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Assign Subject
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {fac.assignments && fac.assignments.length > 0 ? (
                      fac.assignments.map((asg: any) => (
                        <div
                          key={asg.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] border border-indigo-100 dark:border-indigo-900/50"
                        >
                          <span>
                            {asg.subject_code || "Sub"} ({asg.class_section_name})
                          </span>
                          <button
                            onClick={() => handleRemoveAssignment(asg.id)}
                            title="Unassign"
                            className="text-slate-400 hover:text-rose-500 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No assigned subjects yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenEdit(fac)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => handleDeleteFaculty(fac.id, fac.full_name)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                Register New Faculty Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty ID
                  </label>
                  <input
                    type="text"
                    required
                    value={addFormData.faculty_id}
                    onChange={(e) => setAddFormData({ ...addFormData, faculty_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. David Miller"
                    value={addFormData.full_name}
                    onChange={(e) => setAddFormData({ ...addFormData, full_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="david.miller@edutrack.ai"
                    value={addFormData.email}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        email: e.target.value,
                        username: e.target.value.split("@")[0],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={addFormData.department_id}
                    onChange={(e) => setAddFormData({ ...addFormData, department_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={addFormData.designation}
                    onChange={(e) => setAddFormData({ ...addFormData, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={addFormData.qualification}
                    onChange={(e) => setAddFormData({ ...addFormData, qualification: e.target.value })}
                    placeholder="Ph.D. / M.Tech"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={addFormData.specialization}
                    onChange={(e) => setAddFormData({ ...addFormData, specialization: e.target.value })}
                    placeholder="e.g. Distributed Systems"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Faculty Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                Edit Faculty Details: {selectedFaculty?.faculty_id}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFaculty} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subject & Section Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Assign Course to: {selectedFaculty?.full_name}
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Course
                </label>
                <select
                  value={assignFormData.subject_id}
                  onChange={(e) => setAssignFormData({ ...assignFormData, subject_id: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Class Section
                </label>
                <select
                  value={assignFormData.class_section_id}
                  onChange={(e) => setAssignFormData({ ...assignFormData, class_section_id: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={assignFormData.academic_year}
                  onChange={(e) => setAssignFormData({ ...assignFormData, academic_year: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
