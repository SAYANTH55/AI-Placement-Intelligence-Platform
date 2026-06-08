import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Plus, X, ChevronRight, Clock, Users, CheckCircle, 
  AlertCircle, Filter, Zap, Star, LayoutDashboard, Search, 
  FileText, ArrowRight, Bell, Calendar, DollarSign, Trash2
} from 'lucide-react';
import API from '../services/api';
import { useAppContext } from '../context/AppContext';

const AVAILABLE_FIELDS = [
  { id: 'name', label: 'Full Name' },
  { id: 'roll_no', label: 'Roll Number' },
  { id: 'personal_email', label: 'Personal Email' },
  { id: 'university_email', label: 'University Email' },
  { id: 'cgpa', label: 'CGPA' },
  { id: 'backlog_history', label: 'Backlog History' },
  { id: 'experience', label: 'Experience' },
  { id: 'class_name', label: 'Class / Section' },
  { id: 'course', label: 'Course' },
  { id: 'projects', label: 'Projects' },
  { id: 'github', label: 'GitHub Link' },
  { id: 'linkedin', label: 'LinkedIn Link' },
  { id: 'resume_url', label: 'Resume URL / Link' }
];

// --- Shared Components ---

const GlassCard = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`glass-panel rounded-3xl p-6 relative overflow-hidden group hover:border-[#F97316]/30 transition-all shadow-card-depth ${className}`}
  >
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/20 to-transparent" />
    {children}
  </motion.div>
);

const CourseBadge = ({ course }) => {
  const styles = {
    MCA: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    MSAIM: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    ALL: "bg-gray-500/10 text-gray-400 border-gray-500/20"
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${styles[course] || styles.ALL}`}>
      {course === 'MSAIM' ? 'MSc AI/ML' : course}
    </span>
  );
};

const HaloRound = ({ name, status }) => {
  const styles = {
    Pending: "border-gray-800 text-gray-500 bg-gray-500/5",
    Pass: "border-green-500/50 text-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    Fail: "border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${styles[status]}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'Pass' ? 'bg-green-400' : status === 'Fail' ? 'bg-red-400' : 'bg-gray-600'}`} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{name}</span>
    </div>
  );
};

// --- Main Page Component ---

export default function PlacementEngine() {
  const { user } = useAppContext();
  const role = user?.role; // student, pr, admin, dept_admin

  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [courseFilter, setCourseFilter] = useState('ALL');
  const isStudent = role === 'student';
  const isStaff = role === 'pr' || role === 'admin';
  const [form, setForm] = useState({ company_name: '', role: '', description: '', job_description: '', eligibility_criteria: '7.0 CGPA', ctc: '', deadline: '', course: 'ALL', application_form_fields: [] });
  
  // Modal/Drawer States
  const [showPostDrive, setShowPostDrive] = useState(false);
  const [showPostUpdate, setShowPostUpdate] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: '', description: '', update_type: 'announcement', course: 'ALL', action_label: '', action_url: '' });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applyForm, setApplyForm] = useState({});
  const [studentProfile, setStudentProfile] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = courseFilter !== 'ALL' ? `?course=${courseFilter}` : '';
      const [drivesRes, updatesRes] = await Promise.all([
        API.get(`/drive/s${params}`),
        API.get(`/placement-updates/all${params}`)
      ]);
      setDrives(drivesRes.data.data);
      setUpdates(updatesRes.data.data);

      if (isStudent) {
        const [appsRes, profileRes] = await Promise.all([
          API.get('/application/my-applications'),
          API.get('/application-profile/me')
        ]);
        setMyApplications(appsRes.data.data);
        if (profileRes.data.status === 'success') {
          setStudentProfile(profileRes.data.data);
        }
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [courseFilter, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchApplicants = async (driveId) => {
    setDrawerLoading(true);
    try {
      const res = await API.get(`/application/drive/${driveId}`);
      setApplicants(res.data.data);
    } catch (err) {
      console.error("Failed to fetch applicants");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenDrive = (drive) => {
    setSelectedDrive(drive);
    if (isStaff) {
      fetchApplicants(drive.id);
    }
  };

  const handleApply = (drive) => {
    setApplyingTo(drive);
    setShowApplyModal(true);
    // Reset apply form
    setApplyForm({});
  };

  const handleEasyApply = () => {
    if (!studentProfile) return;
    // Map only the known application fields — do NOT spread AI profile_data
    const autoFilled = {
      name:             studentProfile.name         || '',
      personal_email:   studentProfile.personal_email || studentProfile.email || '',
      university_email: studentProfile.university_email || '',
      roll_no:          studentProfile.roll_no       || '',
      cgpa:             String(studentProfile.cgpa   || ''),
      class_name:       studentProfile.class_name    || studentProfile.batch || '',
      course:           studentProfile.course        || '',
      github:           studentProfile.github        || '',
      linkedin:         studentProfile.linkedin      || '',
      experience:       studentProfile.experience    || '',
      backlog_history:  studentProfile.backlog_history || '',
      projects:         studentProfile.projects      || '',
      resume_url:       studentProfile.resume_url    || '',
    };
    setApplyForm(autoFilled);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Fetch AI match score
      const scoreRes = await API.get(`/application/match_score/${applyingTo.id}`);
      const aiScore = scoreRes.data.score || 0;

      // 2. Submit
      const res = await API.post('/application/apply', {
        drive_id: applyingTo.id,
        resume_path: applyForm.resume_url || "profile",
        ai_match_score: aiScore,
        form_responses: applyForm
      });

      if (res.data.status === 'success') {
        alert(`Application submitted successfully! AI Match Score: ${aiScore}%`);
        setShowApplyModal(false);
        setSelectedDrive(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Application failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDrive = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submissionForm = { ...form };
      if (submissionForm.deadline && !submissionForm.deadline.includes('T')) {
        submissionForm.deadline = `${submissionForm.deadline}T23:59:59`;
      }
      await API.post('/drive/create', submissionForm);
      setShowPostDrive(false);
      setForm({ company_name: '', role: '', description: '', job_description: '', eligibility_criteria: '7.0 CGPA', ctc: '', deadline: '', course: 'ALL', application_form_fields: [] });
      fetchData();
      alert("Drive launched successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to launch drive.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      await API.post('/placement-updates/create', updateForm);
      setShowPostUpdate(false);
      setUpdateForm({ title: '', description: '', update_type: 'announcement', course: 'ALL', action_label: '', action_url: '' });
      fetchData();
      alert("Update posted successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to post update");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteDrive = async (driveId) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this drive and all associated applications? This cannot be undone.")) return;
    try {
      await API.delete(`/drive/${driveId}`);
      setSelectedDrive(null);
      fetchData();
      alert("Drive deleted successfully");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete drive");
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!window.confirm("Delete this update? This cannot be undone.")) return;
    try {
      await API.delete(`/placement-updates/${updateId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete update");
    }
  };

  const isApplied = (driveId) => myApplications.some(a => a.drive_id === driveId);
  const getAppStatus = (driveId) => myApplications.find(a => a.drive_id === driveId);

  const statusBadgeColor = (status) => {
    if (status === 'active' || status === 'open' || status === 'Active') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (status === 'closed' || status === 'Closed') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
  };

  const cardBorderColor = (status, applied = false) => {
    if (applied) return '!border-green-500/40 !shadow-[0_0_25px_rgba(34,197,94,0.2)] hover:!border-green-500/60 hover:!shadow-[0_0_35px_rgba(34,197,94,0.3)] bg-green-500/5';
    if (status === 'closed' || status === 'Closed') return '!border-red-500/30 !shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:!border-red-500/50 hover:!shadow-[0_0_30px_rgba(239,68,68,0.25)] bg-red-500/5';
    if (status === 'active' || status === 'open' || status === 'Active') return '!border-blue-500/40 !shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:!border-blue-500/60 hover:!shadow-[0_0_35px_rgba(59,130,246,0.3)] bg-blue-500/5';
    return 'border-[#181818] hover:border-[#F97316]/30';
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white p-6 md:p-10 font-['Inter'] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F97316]/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-gradient-to-b from-[#F97316] to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <h1 className="text-4xl font-black tracking-tight">Placement Engine</h1>
          </div>
          <p className="text-[#555] text-sm ml-4.5 font-medium uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-[#F97316]" /> 
            Institutional Career Intelligence
          </p>
        </div>

        { !isStudent && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Course Filters */}
            <div className="bg-[#0A0A0C] border border-[#181818] p-1 rounded-2xl flex items-center gap-1">
              {['ALL', 'MCA', 'MSAIM'].map(c => (
                <button
                  key={c}
                  onClick={() => setCourseFilter(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    courseFilter === c 
                    ? 'bg-[#F97316] text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                    : 'text-[#555] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {c === 'MSAIM' ? 'MSc AI/ML' : c}
                </button>
              ))}
            </div>
          </div>
        )}


          {/* Action Buttons */}
          {isStaff && (
            <button 
              onClick={() => setShowPostDrive(true)}
              className="bg-[#F97316] text-white px-6 py-3 rounded-2xl text-sm font-black shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Launch Drive
            </button>
          )}
        </div>


      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-12">
          
          {/* Active Applications (Student Only) */}
          {(isStudent) && myApplications.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <LayoutDashboard size={20} className="text-[#F97316]" />
                <h2 className="text-xl font-black uppercase tracking-widest text-[#888]">My Applications</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myApplications.map(app => (
                  <GlassCard key={app.id} className="border-l-4 border-l-[#F97316]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-black">{app.company_name}</h3>
                        <p className="text-xs text-[#555] font-bold">{app.role}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        app.status === 'Placed' ? 'bg-green-500/10 text-green-400' :
                        app.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#181818]">
                      {app.rounds?.map(r => (
                        <HaloRound key={r.round_id} name={r.round_name} status={r.status} />
                      ))}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}

          {/* Drives Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Briefcase size={20} className="text-[#F97316]" />
                <h2 className="text-xl font-black uppercase tracking-widest text-[#888]">Active Placement Drives</h2>
              </div>
              <span className="text-[10px] font-black text-[#444] tracking-[0.2em]">{drives.length} DISCOVERED</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : drives.length === 0 ? (
              <div className="py-20 text-center bg-white/2 rounded-3xl border border-dashed border-[#181818]">
                <p className="text-[#555] font-bold">No active drives matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...drives].sort((a, b) => {
                  const getScore = (d) => {
                    if (isStudent && isApplied(d.id)) return 3;
                    const isOpen = d.status === 'active' || d.status === 'open' || d.status === 'Active';
                    return isOpen ? 2 : 1;
                  };
                  return getScore(b) - getScore(a);
                }).map((drive, idx) => (
                  <GlassCard key={drive.id} delay={idx * 0.05} className={`flex flex-col ${cardBorderColor(drive.status, isStudent && isApplied(drive.id))}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <CourseBadge course={drive.course} />
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${statusBadgeColor(drive.status)}`}>
                            {drive.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {drive.ctc && (
                          <div className="flex items-center gap-1 text-green-400 font-black text-sm">
                            <DollarSign size={14} /> {drive.ctc}
                          </div>
                        )}
                        {role === 'admin' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDrive(drive.id); }}
                            className="p-1.5 rounded-lg text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete Drive"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-[#F97316] transition-colors">{drive.company_name}</h3>
                    <p className="text-xs text-[#F97316]/70 font-black uppercase tracking-widest mb-4">{drive.role}</p>
                    
                    <p className="text-xs text-[#999] line-clamp-2 mb-6 flex-1 italic">
                      "{drive.description}"
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#777]">
                        <Clock size={12} /> Deadline: {new Date(drive.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#777]">
                        <Users size={12} /> {drive.application_count} Applied
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-[#181818]">
                      {(isStudent) ? (
                        isApplied(drive.id) ? (
                          <button 
                            onClick={() => handleOpenDrive(drive)}
                            className="flex-1 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                          >
                            <CheckCircle size={14} className="text-green-400" /> Progress
                          </button>
                        ) : (drive.status === 'closed' || drive.status === 'Closed') ? (
                          <div className="flex-1"></div>
                        ) : (
                          <button 
                            onClick={() => handleApply(drive)}
                            className="flex-1 bg-[#F97316] text-white py-2.5 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all"
                          >
                            Apply Now
                          </button>
                        )
                      ) : (
                        <button 
                          onClick={() => handleOpenDrive(drive)}
                          className="flex-1 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                        >
                          View Applicants <ArrowRight size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenDrive(drive)}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:text-[#F97316] transition-all"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar area: Updates & News */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-[#F97316]" />
                <h2 className="text-lg font-black uppercase tracking-widest text-[#888]">Updates</h2>
              </div>
              {isStaff && (
                <button onClick={() => setShowPostUpdate(true)} className="p-1.5 bg-white/5 rounded-lg text-[#555] hover:text-[#F97316] transition-all">
                  <Plus size={14} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {updates.map((upd, idx) => (
                <motion.div
                  key={upd.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-5 rounded-3xl border border-[#181818] bg-gradient-to-br transition-all hover:border-[#F97316]/30 relative group ${
                    upd.update_type === 'test' ? 'from-orange-500/5 to-transparent' :
                    upd.update_type === 'workshop' ? 'from-blue-500/5 to-transparent' : 'from-gray-500/5 to-transparent'
                  }`}
                >
                  {/* Delete button for staff */}
                  {isStaff && (
                    <button
                      onClick={() => handleDeleteUpdate(upd.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-red-500/0 group-hover:text-red-500/60 hover:!text-red-400 hover:!bg-red-500/10 transition-all"
                      title="Delete Update"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                      upd.update_type === 'test' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      upd.update_type === 'workshop' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {upd.update_type}
                    </span>
                    <CourseBadge course={upd.course} />
                  </div>
                  <h4 className="text-sm font-black text-white mb-1">{upd.title}</h4>
                  <p className="text-[11px] text-[#777] leading-relaxed mb-4">{upd.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#555] font-bold">{new Date(upd.created_at).toLocaleDateString()}</span>
                    {upd.action_url && (
                      <a href={upd.action_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-[#F97316] flex items-center gap-1 hover:underline">
                        {upd.action_label || 'View'} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Quick Stats / Info */}
          <GlassCard className="bg-gradient-to-br from-[#F97316]/5 to-transparent border-none">
            <h4 className="text-xs font-black text-[#F97316] uppercase tracking-[0.2em] mb-4">Placement Notice</h4>
            <p className="text-[11px] text-[#888] leading-relaxed mb-4">
              All students are required to keep their Profile Intelligence score above 70% to be eligible for priority drives.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-white/50">
              <AlertCircle size={12} /> Verify your documents today.
            </div>
          </GlassCard>
        </div>
      </div>

      {/* --- Modals & Overlays --- */}

      <AnimatePresence>
        {selectedDrive && (
          <div className="fixed top-16 left-0 right-0 bottom-0 z-[200] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDrive(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl glass-panel shadow-2xl h-full flex flex-col overflow-hidden"
            >
              {/* Drive Header Banner */}
              <div className="relative bg-gradient-to-br from-[#F97316]/20 via-transparent to-transparent border-b border-[#F97316]/20">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
                <div className="relative p-8">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-[#F97316] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                        <Briefcase size={28} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white leading-tight">{selectedDrive.company_name}</h2>
                        <p className="text-sm text-[#F97316] font-black uppercase tracking-[0.15em] mt-1">{selectedDrive.role}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            selectedDrive.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>{selectedDrive.status}</span>
                          <CourseBadge course={selectedDrive.course} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteDrive(selectedDrive.id)}
                          className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-black flex items-center gap-1.5"
                          title="Delete Drive"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      )}
                      <button onClick={() => setSelectedDrive(null)} className="p-2.5 bg-white/5 rounded-xl text-[#888] hover:text-white hover:bg-white/10 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-10 custom-scrollbar">
                {/* Drive Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white/2 rounded-3xl border border-[#181818]">
                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-1">Package / CTC</p>
                    <p className="text-xl font-black text-green-400">{selectedDrive.ctc || 'Not Disclosed'}</p>
                  </div>
                  <div className="p-5 bg-white/2 rounded-3xl border border-[#181818]">
                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-1">Deadline</p>
                    <p className="text-lg font-bold">{new Date(selectedDrive.deadline).toLocaleString()}</p>
                  </div>
                </div>

                {/* Job Description Area */}
                <section>
                  <h3 className="text-xs font-black text-[#F97316] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <FileText size={14} /> Full Job Description
                  </h3>
                  <div className="p-6 bg-white/2 rounded-3xl border border-[#181818] text-sm text-[#888] leading-relaxed whitespace-pre-wrap">
                    {selectedDrive.job_description || selectedDrive.description || "No detailed description provided."}
                  </div>
                </section>

                {/* Eligibility */}
                <section>
                  <h3 className="text-xs font-black text-[#F97316] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <CheckCircle size={14} /> Eligibility Criteria
                  </h3>
                  <p className="text-sm text-[#888] bg-white/2 p-4 rounded-2xl border border-[#181818]">
                    {selectedDrive.eligibility_criteria}
                  </p>
                </section>

                {/* Role Based Section: Tracking or Applicant List */}
                {(isStudent) ? (
                  isApplied(selectedDrive.id) && (
                    <section>
                      <h3 className="text-xs font-black text-[#F97316] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <LayoutDashboard size={14} /> Application Tracking
                      </h3>
                      <div className="space-y-4">
                        {getAppStatus(selectedDrive.id)?.rounds?.map((r, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                                r.status === 'Pass' ? 'border-green-500 bg-green-500/10 text-green-400' :
                                r.status === 'Fail' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-[#222] bg-[#111] text-[#444]'
                              }`}>
                                {i + 1}
                              </div>
                              {i < (getAppStatus(selectedDrive.id).rounds.length - 1) && (
                                <div className="w-0.5 h-10 bg-[#181818]" />
                              )}
                            </div>
                            <div className="flex-1 pb-10">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-black text-sm">{r.round_name}</h4>
                                <span className={`text-[10px] font-black uppercase ${
                                  r.status === 'Pass' ? 'text-green-400' : r.status === 'Fail' ? 'text-red-400' : 'text-[#444]'
                                }`}>
                                  {r.status}
                                </span>
                              </div>
                              <p className="text-xs text-[#555]">Completed evaluation for this stage.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                ) : (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-[#F97316] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={14} /> Registered Applicants
                      </h3>
                      <button className="text-[10px] font-black text-[#F97316] uppercase hover:underline">Export CSV</button>
                    </div>

                    <div className="bg-[#050505] border border-[#181818] rounded-3xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white/2 border-b border-[#181818]">
                            <th className="p-4 font-black text-[#555] uppercase tracking-widest">Student</th>
                            <th className="p-4 font-black text-[#555] uppercase tracking-widest">AI Match</th>
                            <th className="p-4 font-black text-[#555] uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#181818]">
                          {drawerLoading ? (
                            <tr><td colSpan="3" className="p-10 text-center text-[#444]">Syncing data...</td></tr>
                          ) : applicants.length === 0 ? (
                            <tr><td colSpan="3" className="p-10 text-center text-[#444]">No applicants yet.</td></tr>
                          ) : applicants.sort((a,b) => (b.ai_match_score||0) - (a.ai_match_score||0)).map(app => (
                            <tr key={app.id} className="hover:bg-white/1 transition-colors">
                              <td className="p-4">
                                <p className="font-bold">{app.student_name}</p>
                                <p className="text-[10px] text-[#444]">Batch {app.student_batch}</p>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-[#111] rounded-full overflow-hidden w-16">
                                    <div className="h-full bg-[#F97316]" style={{ width: `${app.ai_match_score || 0}%` }} />
                                  </div>
                                  <span className="font-black text-[#F97316]">{app.ai_match_score || 0}%</span>
                                </div>
                              </td>
                              <td className="p-4 flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  app.status === 'Placed' ? 'bg-green-500/10 text-green-400' :
                                  app.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                                }`}>
                                  {app.status}
                                </span>
                                {app.form_responses?.resume_url && (
                                  <a href={app.form_responses.resume_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                                    <FileText size={10} /> Resume
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>

              {(isStudent) && !isApplied(selectedDrive.id) && (
                <div className="p-8 border-t border-[#181818] bg-[#050505]">
                  <button 
                    onClick={() => handleApply(selectedDrive)}
                    className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_35px_rgba(249,115,22,0.5)] transition-all"
                  >
                    Confirm Application
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Basic Post Drive Modal Placeholder */}
      <AnimatePresence>
        {showPostDrive && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPostDrive(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-panel shadow-card-depth rounded-[2rem] p-10 max-w-2xl w-full">
              <h2 className="text-2xl font-black mb-2">Launch New Drive</h2>
              <p className="text-[#555] text-sm mb-8">Establish a new institutional placement record.</p>
              
              <div className="space-y-4">
                <input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Company Name" className="w-full glass-search p-4 rounded-2xl text-sm outline-none" />
                <input value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="Job Role" className="w-full glass-search p-4 rounded-2xl text-sm outline-none" />
                <textarea value={form.job_description} onChange={e => setForm({...form, job_description: e.target.value, description: e.target.value.substring(0, 100) + '...'})} placeholder="Job Description (Detailed for AI Match)" className="w-full glass-search p-4 rounded-2xl text-sm outline-none h-32" />
                <div className="grid grid-cols-2 gap-4">
                  <input value={form.ctc} onChange={e => setForm({...form, ctc: e.target.value})} placeholder="CTC / Package" className="w-full glass-search p-4 rounded-2xl text-sm outline-none" />
                  <input value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} type="date" className="w-full glass-search p-4 rounded-2xl text-sm outline-none text-[#555]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="w-full glass-search p-4 rounded-2xl text-sm outline-none text-[#555]">
                    <option value="ALL">All Courses</option>
                    <option value="MCA">MCA</option>
                    <option value="MSAIM">MSc AI/ML</option>
                  </select>
                  <input value={form.eligibility_criteria} onChange={e => setForm({...form, eligibility_criteria: e.target.value})} placeholder="Eligibility (e.g. 7.0 CGPA)" className="w-full glass-search p-4 rounded-2xl text-sm outline-none" />
                </div>

                <div className="border-t border-white/5 pt-6">
                  <p className="text-[10px] font-black text-[#F97316] uppercase tracking-[0.2em] mb-4">Required Application Fields</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AVAILABLE_FIELDS.map(field => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => {
                          const current = form.application_form_fields || [];
                          if (current.includes(field.id)) {
                            setForm({...form, application_form_fields: current.filter(id => id !== field.id)});
                          } else {
                            setForm({...form, application_form_fields: [...current, field.id]});
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          form.application_form_fields?.includes(field.id)
                            ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                            : 'bg-white/2 border-white/5 text-[#444] hover:border-white/10'
                        }`}
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleLaunchDrive} className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-black mt-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 transition-all">Establish Drive</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Update Modal */}
      <AnimatePresence>
        {showPostUpdate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPostUpdate(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-panel shadow-card-depth rounded-[2rem] p-10 max-w-lg w-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black">Post Placement Update</h2>
                  <p className="text-[#555] text-sm mt-1">Announcements, tests, or workshops for students.</p>
                </div>
                <button onClick={() => setShowPostUpdate(false)} className="p-2 hover:bg-white/5 rounded-full text-[#555] hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePostUpdate} className="space-y-4">
                <input
                  required
                  value={updateForm.title}
                  onChange={e => setUpdateForm({...updateForm, title: e.target.value})}
                  placeholder="Update Title (e.g. Test Tomorrow)"
                  className="w-full glass-search p-4 rounded-2xl text-sm outline-none"
                />
                <textarea
                  required
                  value={updateForm.description}
                  onChange={e => setUpdateForm({...updateForm, description: e.target.value})}
                  placeholder="Detailed description..."
                  rows={3}
                  className="w-full glass-search p-4 rounded-2xl text-sm outline-none resize-none"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-2">Type</label>
                    <select
                      value={updateForm.update_type}
                      onChange={e => setUpdateForm({...updateForm, update_type: e.target.value})}
                      className="w-full glass-search p-4 rounded-2xl text-sm outline-none"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="test">Test / Assessment</option>
                      <option value="workshop">Workshop / Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-2">Target Course</label>
                    <select
                      value={updateForm.course}
                      onChange={e => setUpdateForm({...updateForm, course: e.target.value})}
                      className="w-full glass-search p-4 rounded-2xl text-sm outline-none"
                    >
                      <option value="ALL">All Courses</option>
                      <option value="MCA">MCA</option>
                      <option value="MSAIM">MSAIM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={updateForm.action_label}
                    onChange={e => setUpdateForm({...updateForm, action_label: e.target.value})}
                    placeholder="Button Label (Optional)"
                    className="w-full glass-search p-4 rounded-2xl text-sm outline-none"
                  />
                  <input
                    value={updateForm.action_url}
                    onChange={e => setUpdateForm({...updateForm, action_url: e.target.value})}
                    placeholder="Link URL (Optional)"
                    className="w-full glass-search p-4 rounded-2xl text-sm outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full bg-gradient-to-r from-[#F97316] to-[#fb923c] text-white py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {updateLoading ? 'Posting...' : 'Post Update'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Application Form Modal */}
      <AnimatePresence>
        {showApplyModal && applyingTo && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApplyModal(false)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative glass-panel shadow-card-depth rounded-[2.5rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-[#F97316]/10"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Apply for {applyingTo.role}</h2>
                  <p className="text-[#555] text-sm mt-1">{applyingTo.company_name} · Complete the form to establish your candidacy.</p>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="p-2.5 bg-white/5 rounded-2xl text-[#555] hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Easy Apply Banner */}
              <div className="mb-8 p-4 bg-gradient-to-r from-[#F97316]/20 to-transparent border border-[#F97316]/30 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                    <Zap size={20} className="text-white fill-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Instant Data Sync</h4>
                    <p className="text-[11px] text-[#F97316] font-bold uppercase tracking-wider">Use verified profile data</p>
                  </div>
                </div>
                <button 
                  onClick={handleEasyApply}
                  className="px-6 py-2.5 bg-white text-black text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  Easy Apply
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={submitApplication} className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(applyingTo.application_form_fields?.length > 0 ? applyingTo.application_form_fields : ['name', 'personal_email', 'resume_url']).map(fieldId => {
                    const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
                    if (!field) return null;

                    return (
                      <div key={fieldId} className={['experience', 'projects', 'backlog_history'].includes(fieldId) ? 'md:col-span-2' : ''}>
                        <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-2 px-1">{field.label}</label>
                        {fieldId === 'experience' || fieldId === 'backlog_history' ? (
                          <textarea 
                            value={applyForm[fieldId] || ''} 
                            onChange={e => setApplyForm({...applyForm, [fieldId]: e.target.value})}
                            required
                            className="w-full glass-search p-4 rounded-2xl text-sm outline-none h-32 resize-none"
                          />
                        ) : fieldId === 'projects' ? (
                          <textarea 
                            value={typeof applyForm[fieldId] === 'object' ? JSON.stringify(applyForm[fieldId], null, 2) : applyForm[fieldId] || ''} 
                            onChange={e => setApplyForm({...applyForm, [fieldId]: e.target.value})}
                            required
                            placeholder="Describe your key projects..."
                            className="w-full glass-search p-4 rounded-2xl text-sm outline-none h-32 resize-none"
                          />
                        ) : fieldId === 'resume_url' ? (
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const res = await API.post('/application-profile/upload-resume', formData);
                                  if (res.data.status === 'success') {
                                     setApplyForm({...applyForm, [fieldId]: res.data.resume_url});
                                  }
                                } catch (err) {
                                  alert("Failed to upload file");
                                }
                              }}
                              className="w-full text-sm text-[#888] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#F97316] file:text-white hover:file:bg-[#ea580c] transition-all bg-black/50 border border-[#181818] p-2 rounded-2xl focus:border-[#F97316] outline-none"
                            />
                            {applyForm[fieldId] && (
                              <p className="mt-2 text-[10px] text-green-400 font-bold truncate">✓ Ready: {applyForm[fieldId].split('/').pop()}</p>
                            )}
                          </div>
                        ) : (
                            <input 
                              type={fieldId.includes('email') ? 'email' : fieldId.includes('url') ? 'url' : 'text'}
                              value={applyForm[fieldId] || ''} 
                              onChange={e => setApplyForm({...applyForm, [fieldId]: e.target.value})}
                              required
                              className="w-full glass-search p-4 rounded-2xl text-sm outline-none"
                            />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-black shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] transition-all flex items-center justify-center gap-2"
                  >
                    Submit Application <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

const ExternalLink = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);
