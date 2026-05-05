import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Hash, BookOpen, Target,
  Briefcase, Code, Globe, Save,
  Zap, CheckCircle, AlertCircle, FileText, Link as LinkIcon
} from 'lucide-react';
import API from '../services/api';

const FIELDS = [
  { id: 'name',             label: 'Full Name',          icon: User,        type: 'text',   fullWidth: false, topLevel: true },
  { id: 'roll_no',          label: 'Roll Number',         icon: Hash,        type: 'text',   fullWidth: false },
  { id: 'personal_email',   label: 'Personal Email',      icon: Mail,        type: 'email',  fullWidth: false },
  { id: 'university_email', label: 'University Email',    icon: Mail,        type: 'email',  fullWidth: false },
  { id: 'cgpa',             label: 'CGPA',                icon: Target,      type: 'number', fullWidth: false, topLevel: true, step: '0.01' },
  { id: 'batch',            label: 'Batch / Year',        icon: BookOpen,    type: 'text',   fullWidth: false, topLevel: true },
  { id: 'class_name',       label: 'Class / Section',     icon: BookOpen,    type: 'text',   fullWidth: false },
  { id: 'course',           label: 'Course',              icon: Briefcase,   type: 'text',   fullWidth: false },
  { id: 'github',           label: 'GitHub Link',         icon: Code,        type: 'url',    fullWidth: false },
  { id: 'linkedin',         label: 'LinkedIn Link',       icon: Globe,       type: 'url',    fullWidth: false },
  { id: 'resume_url',       label: 'Resume Upload (PDF/DOC)', icon: LinkIcon,    type: 'file',    fullWidth: false },
  { id: 'backlog_history',  label: 'Backlog History',     icon: AlertCircle, type: 'textarea', fullWidth: true },
  { id: 'experience',       label: 'Work Experience',     icon: Briefcase,   type: 'textarea', fullWidth: true },
  { id: 'projects',         label: 'Projects',            icon: FileText,    type: 'textarea', fullWidth: true },
];

const inputClass = "w-full bg-[#0A0A0C] border border-[#1a1a1a] p-4 rounded-2xl text-sm text-white placeholder-[#333] focus:border-[#F97316] outline-none transition-all";

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    API.get('/application-profile/me')
      .then(res => {
        if (res.data.status === 'success') {
          setProfile(res.data.data || {});
        }
      })
      .catch(err => console.error('Failed to load profile', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id, value) => setProfile(prev => ({ ...prev, [id]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = { ...profile };
      if (payload.cgpa) payload.cgpa = parseFloat(payload.cgpa) || undefined;
      await API.put('/application-profile/me', payload);
      setMessage({ text: 'Profile saved! This data will be used for Easy Apply.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to save profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#060606]">
        <div className="w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#060606] p-6 md:p-10 overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F97316]/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/3 blur-[100px] -z-10 rounded-full" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 bg-gradient-to-b from-[#F97316] to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              <h1 className="text-3xl font-black text-white tracking-tight">My Application Profile</h1>
            </div>
            <p className="text-[#555] text-sm ml-4 font-medium uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-[#F97316]" />
              Pre-save your details · Powers the Easy Apply feature
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-[#F97316] text-white rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={17} />
            }
            Save Profile
          </button>
        </div>

        {/* Easy Apply Banner */}
        <div className="mb-8 p-5 bg-gradient-to-r from-[#F97316]/10 to-transparent border border-[#F97316]/20 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 bg-[#F97316]/20 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={22} className="text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white mb-0.5">How Easy Apply Works</h3>
            <p className="text-xs text-[#666] leading-relaxed">
              When you click <span className="text-[#F97316] font-bold">Apply Now</span> on a drive, the application form will auto-fill with the details you save here. You can still review and edit before submitting.
            </p>
          </div>
        </div>

        {/* Status Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{message.text}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
          {FIELDS.map(field => {
            const Icon = field.icon;
            return (
              <div key={field.id} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <label className="flex items-center gap-2 text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-2.5 px-1">
                  <Icon size={12} className="text-[#F97316]/60" />
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={profile[field.id] || ''}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={`Enter your ${field.label.toLowerCase()}...`}
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                ) : field.type === 'file' ? (
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
                             handleChange(field.id, res.data.resume_url);
                          }
                        } catch (err) {
                          alert("Failed to upload file");
                        }
                      }}
                      className="w-full text-sm text-[#888] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#F97316] file:text-white hover:file:bg-[#ea580c] transition-all bg-[#0A0A0C] border border-[#1a1a1a] rounded-2xl p-2 focus:border-[#F97316] outline-none"
                    />
                    {profile[field.id] && (
                      <p className="mt-2 text-[10px] text-green-400 font-bold truncate">✓ File Uploaded: {profile[field.id].split('/').pop()}</p>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    step={field.step}
                    value={profile[field.id] || ''}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={`Your ${field.label}...`}
                    className={inputClass}
                  />
                )}
              </div>
            );
          })}

          {/* Save at bottom too */}
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#F97316] to-[#fb923c] text-white py-4 rounded-2xl font-black shadow-[0_0_25px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Application Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
