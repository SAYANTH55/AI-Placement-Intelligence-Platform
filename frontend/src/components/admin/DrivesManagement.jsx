import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { Plus, ChevronRight, Briefcase, Calendar, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

const AVAILABLE_FIELDS = [
  { id: 'name',             label: 'Full Name' },
  { id: 'roll_no',          label: 'Roll Number' },
  { id: 'personal_email',   label: 'Personal Email' },
  { id: 'university_email', label: 'University Email' },
  { id: 'cgpa',             label: 'CGPA' },
  { id: 'backlog_history',  label: 'Backlog History' },
  { id: 'experience',       label: 'Experience' },
  { id: 'class_name',       label: 'Class / Section' },
  { id: 'course',           label: 'Course' },
  { id: 'projects',         label: 'Projects' },
  { id: 'github',           label: 'GitHub Link' },
  { id: 'linkedin',         label: 'LinkedIn Link' },
  { id: 'resume_url',       label: 'Resume URL / Link' },
];

const EMPTY_FORM = {
  company_name: '', role: '', description: '', job_description: '',
  eligibility_criteria: '', deadline: '', ctc: '', course: 'ALL',
  status: 'open', application_form_fields: [],
  rounds: [{ round_number: 1, round_name: 'Aptitude / Screening' }]
};

const inputCls = "w-full glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted";

export default function DrivesManagement() {
  const { user } = useAppContext();
  const [drives, setDrives] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const canCreate = user?.role === 'admin' || user?.role === 'pr';

  const fetchDrives = () => {
    setLoading(true);
    API.get('/drive/all')
      .then(res => setDrives(res.data.data))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrives(); }, []);

  const toggleField = (fieldId) => {
    const current = form.application_form_fields || [];
    if (current.includes(fieldId)) {
      setForm({ ...form, application_form_fields: current.filter(id => id !== fieldId) });
    } else {
      setForm({ ...form, application_form_fields: [...current, fieldId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submissionForm = { ...form };
      if (submissionForm.deadline && !submissionForm.deadline.includes('T')) {
        let d = submissionForm.deadline;
        if (/^\d{2}-\d{2}-\d{4}$/.test(d)) { const [day, m, y] = d.split('-'); d = `${y}-${m}-${day}`; }
        submissionForm.deadline = `${d}T23:59:59`;
      }
      if (editingId) {
        await API.patch(`/drive/${editingId}`, submissionForm);
      } else {
        await API.post('/drive/create', submissionForm);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchDrives();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to save drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (drive) => {
    setForm({
      company_name: drive.company_name || '',
      role: drive.role || '',
      description: drive.description || '',
      job_description: drive.job_description || '',
      eligibility_criteria: drive.eligibility_criteria || '',
      deadline: (drive.deadline || '').split('T')[0],
      ctc: drive.ctc || '',
      course: drive.course || 'ALL',
      status: drive.status || 'open',
      application_form_fields: drive.application_form_fields || [],
      rounds: drive.rounds && drive.rounds.length > 0 ? drive.rounds : [{ round_number: 1, round_name: 'Aptitude / Screening' }],
    });
    setEditingId(drive.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this drive?')) return;
    try {
      await API.delete(`/drive/${id}`);
      fetchDrives();
    } catch (err) {
      alert('Failed to delete drive.');
    }
  };

  const statusBadge = (s) => {
    if (s === 'open') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (s === 'closed') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-[#FF4D26]/10 text-primary-accent border-[#FF4D26]/20';
  };

  const cardBorder = (s) => {
    if (s === 'open') return 'border-green-500/20 hover:border-green-500/40';
    if (s === 'closed') return 'border-red-500/20 hover:border-red-500/30 bg-red-500/[0.03]';
    return 'border-white/5 hover:border-primary-accent/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Placement Drives</h1>
          <p className="text-xs text-secondary-muted mt-1">
            {user?.role === 'admin' ? 'Create, edit and manage all placement drives' : 'Create placement drives for your assigned students'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              if (showForm && !editingId) { setShowForm(false); return; }
              setEditingId(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-neon-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-neon-glow hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} /> {showForm && !editingId ? 'Cancel' : 'New Drive'}
          </button>
        )}
      </motion.div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="glass-panel shadow-card-depth rounded-3xl p-8 space-y-5 mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-white">{editingId ? 'Edit Drive' : 'Launch New Drive'}</h2>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }} className="text-xs text-secondary-muted hover:text-white transition-all">Cancel</button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Company Name *" className={inputCls} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required />
                <input placeholder="Job Role *" className={inputCls} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required />
              </div>
              <textarea
                placeholder="Short Description * (visible on drive card)"
                className={`${inputCls} h-20 resize-none`}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
              />
              <textarea
                placeholder="Full Job Description (used for AI Match scoring)"
                className={`${inputCls} h-28 resize-none`}
                value={form.job_description}
                onChange={e => setForm({ ...form, job_description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Package / CTC (e.g. 10 LPA)" className={inputCls} value={form.ctc} onChange={e => setForm({ ...form, ctc: e.target.value })} />
                <input placeholder="Eligibility Criteria *" className={inputCls} value={form.eligibility_criteria} onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input type="date" className={`${inputCls} text-[#888]`} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
                <select className={`${inputCls} text-[#888]`} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                  <option value="ALL">All Courses</option>
                  <option value="MCA">MCA</option>
                  <option value="MSAIM">MSc AI/ML</option>
                </select>
                {editingId && (
                  <select className={`${inputCls} text-[#888]`} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                )}
              </div>

              {/* Rounds Configuration */}
              <div className="border-t border-white/5 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-primary-accent uppercase tracking-[0.2em] mb-1">Recruitment Rounds</p>
                    <p className="text-[11px] text-tertiary-muted">Define the sequence of rounds for this drive. (Minimum 1 required)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newRounds = [...(form.rounds || [])];
                      newRounds.push({ round_number: newRounds.length + 1, round_name: '' });
                      setForm({ ...form, rounds: newRounds });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4D26]/10 text-primary-accent text-[11px] font-bold rounded-lg hover:bg-[#FF4D26]/20 transition-all"
                  >
                    <Plus size={14} /> Add Round
                  </button>
                </div>
                <div className="space-y-3">
                  {(form.rounds || []).map((round, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-secondary-muted shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        placeholder="e.g. Aptitude Test, Technical Interview, HR Round..."
                        className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder-tertiary-muted"
                        value={round.round_name}
                        onChange={(e) => {
                          const newRounds = [...form.rounds];
                          newRounds[idx].round_name = e.target.value;
                          setForm({ ...form, rounds: newRounds });
                        }}
                        required
                      />
                      {(form.rounds || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            let newRounds = form.rounds.filter((_, i) => i !== idx);
                            newRounds = newRounds.map((r, i) => ({ ...r, round_number: i + 1 }));
                            setForm({ ...form, rounds: newRounds });
                          }}
                          className="p-2 text-[#555] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Form Fields Selector */}
              <div className="border-t border-white/5 pt-6">
                <div className="mb-4">
                  <p className="text-[10px] font-black text-primary-accent uppercase tracking-[0.2em] mb-1">Application Form Fields</p>
                  <p className="text-[11px] text-tertiary-muted">Select which fields students must fill when applying to this drive. Leave empty to use default (Name + Email).</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_FIELDS.map(field => {
                    const selected = (form.application_form_fields || []).includes(field.id);
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => toggleField(field.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all text-left ${
                          selected
                            ? 'bg-[#FF4D26]/15 border-[#FF4D26]/50 text-primary-accent'
                            : 'bg-white/5 border-white/5 text-secondary-muted hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {selected ? <CheckSquare size={13} className="shrink-0" /> : <Square size={13} className="shrink-0 opacity-30" />}
                        {field.label}
                      </button>
                    );
                  })}
                </div>
                {(form.application_form_fields || []).length > 0 && (
                  <p className="mt-3 text-[10px] text-primary-accent font-bold opacity-80">
                    {form.application_form_fields.length} field{form.application_form_fields.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neon-gradient shadow-neon-glow text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:-translate-y-0.5 transition-all"
              >
                {loading ? 'Saving...' : (editingId ? 'Save Changes' : 'Launch Drive')}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drives Grid */}
      {loading && !showForm ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drives.map((drive, idx) => (
            <motion.div
              key={drive.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`glass-panel shadow-card-depth rounded-2xl p-5 transition-all group relative overflow-hidden ${cardBorder(drive.status)}`}
            >
              {drive.status === 'closed' && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/20 to-transparent pointer-events-none rounded-bl-full" />
              )}
              <div className="flex justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${drive.status === 'closed' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#FF4D26]/10 border-[#FF4D26]/20 text-primary-accent'}`}>
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white leading-tight">{drive.company_name}</h3>
                    <p className="text-[10px] text-secondary-muted font-bold uppercase tracking-wider">{drive.course}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded-lg uppercase font-black border h-fit ${statusBadge(drive.status)}`}>{drive.status}</span>
              </div>

              <p className="text-xs text-tertiary-muted font-bold uppercase tracking-wider mb-1">{drive.role}</p>
              {drive.ctc && <p className="text-xs font-black text-green-400 mb-3">{drive.ctc}</p>}
              {drive.description && <p className="text-xs text-secondary-muted mb-3 line-clamp-2 italic">"{drive.description}"</p>}

              {/* Form fields indicator */}
              {drive.application_form_fields?.length > 0 && (
                <p className="text-[9px] text-primary-accent font-bold mb-3 opacity-80">
                  📋 {drive.application_form_fields.length} custom field{drive.application_form_fields.length !== 1 ? 's' : ''} required
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-1.5 text-[10px] text-tertiary-muted font-bold">
                  <Calendar size={11} />
                  <span>{new Date(drive.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {canCreate && (
                    <>
                      <button onClick={() => handleEdit(drive)} className="p-1.5 rounded-lg text-secondary-muted hover:text-primary-accent hover:bg-white/5 transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(drive.id)} className="p-1.5 rounded-lg text-secondary-muted hover:text-red-400 hover:bg-red-500/5 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </>
                  )}
                  <Link to={`/admin/applications?drive=${drive.id}`} className="p-1.5 rounded-lg text-primary-accent hover:bg-[#FF4D26]/10 transition-colors ml-1" title="View Applicants">
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {drives.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-[#181818] rounded-3xl">
              <p className="text-[#888] font-bold">No placement drives yet.</p>
              {canCreate && <p className="text-[#555] text-xs mt-2">Click "New Drive" above to create the first one.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
