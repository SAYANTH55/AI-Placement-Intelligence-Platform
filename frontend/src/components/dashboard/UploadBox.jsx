import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, FileText, Zap, X, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';

const COMMON_ROLES = [
  "Full Stack Developer", "Backend Developer", "Frontend Developer",
  "Data Scientist", "AI/ML Engineer", "DevOps Engineer",
  "Cyber Security Analyst", "UI/UX Designer"
];

export default function UploadBox({ onAnalyzeComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('analyzing');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedRole) {
      formData.append('target_role', selectedRole);
    }

    try {
      // Simulate progress bar while uploading/processing
      const interval = setInterval(() => {
        setProgress(old => (old >= 90 ? old : old + 5));
      }, 200);

      console.log('🚀 Starting resume upload to /upload_resume endpoint...');
      const response = await API.post('/upload_resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(interval);
      setProgress(100);
      setStatus('complete');

      console.log('✅ API Response:', response.data);

      // The backend returns { status: 'success', data: { extractedText, skills, experience, prediction, roleMatches } }
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }

      const raw = response.data.data;
      
      // Validate essential data
      if (!raw.skills) {
        throw new Error('No skills extracted from resume');
      }

      if (!raw.roleMatches || !Array.isArray(raw.roleMatches)) {
        throw new Error('No role matches found');
      }

      // Calculate missing skills dynamically from the top role
      const topRole = raw.roleMatches[0];
      const dynamicMissing = topRole ? topRole.missing : [];
      
      const formattedResult = {
        score: Math.round(raw.prediction.placement_probability * 100),
        status: raw.prediction.readiness,
        skills: raw.skills.slice(0, 8), // Show up to 8 strong matches
        missing: dynamicMissing.slice(0, 5), // Show top 5 gaps from the best matched role
        allDetected: raw.skills,
        extractedText: raw.extractedText,
        prediction: raw.prediction,
        // Map the real role matches from the backend (includes present & missing skills)
        jobRoles: raw.roleMatches.map(m => ({
          title: m.role,
          match: m.match,
          salary: m.salary,
          present: m.present || [],
          missing: m.missing || []
        })),
        recommendations: dynamicMissing.length > 0 && topRole
          ? dynamicMissing.map(s => `Master ${s} to improve your ${topRole.role || 'targeted'} readiness`)
          : ['Continue building projects'],
        companies: ['Google', 'Meta', 'Amazon', 'Netflix', 'Microsoft', 'OpenAI'],
        interview_confidence: Math.max(0, Math.min(100, Math.round(raw.prediction.placement_probability * 100 * 0.9))),
        technical_depth: Math.max(0, Math.min(100, Math.round(raw.prediction.placement_probability * 100))),
        // Hybrid AI extensions
        llm_enhancement: raw.llm_enhancement || null,
        llm_insights: raw.llm_insights || null,
        experience_advantage_roles: raw.experience_advantage_roles || []
      };

      console.log('✅ Analysis complete:', formattedResult);

      setTimeout(() => {
        if (onAnalyzeComplete) {
          onAnalyzeComplete(formattedResult);
          console.log('✅ Data passed to Dashboard component');
        }
      }, 600);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setStatus('idle');
      
      // Better error messages
      let errorMsg = 'Analysis failed. ';
      if (error.response?.status === 500) {
        errorMsg += `Server error: ${error.response.data?.detail || 'Please check the backend logs'}`;
      } else if (error.response?.status === 422) {
        errorMsg += 'Invalid file format. Please upload a PDF, DOC, or DOCX file.';
      } else if (error.message === 'Network Error') {
        errorMsg += 'Backend server is not running. Please start it first.';
      } else {
        errorMsg += error.message || 'Unknown error occurred';
      }
      
      alert('❌ ' + errorMsg);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setSelectedRole('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-8 overflow-hidden"
    >
      {/* Top neon accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/40 to-transparent" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
          <h3 className="text-lg font-black text-white">Resume Intelligence</h3>
        </div>
        <p className="text-[#555] text-sm ml-3">Upload your resume to extract skills, map gaps, and predict placement readiness.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                isDragActive
                  ? 'border-[#F97316] bg-[#F97316]/5 scale-[1.01]'
                  : 'border-[#222] hover:border-[#F97316]/50 hover:bg-[#F97316]/3'
              }`}
            >
              <input {...getInputProps()} />

              {/* Scanning grid line */}
              {isDragActive && (
                <motion.div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F97316] to-transparent"
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              )}

              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-all duration-300 ${
                  isDragActive
                    ? 'bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.3)]'
                    : 'bg-[#111] border border-[#222] text-[#444] group-hover:border-[#F97316]/30'
                }`}
              >
                <UploadCloud className="h-8 w-8" />
              </motion.div>

              <p className="text-white font-black text-base mb-1">
                {isDragActive ? 'Drop it — we\'ll take it from here' : 'Drag & drop your resume'}
              </p>
              <p className="text-[#444] text-xs mb-5">or click to browse files</p>

              <motion.span
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-[#F97316] text-white text-sm font-black px-6 py-2.5 rounded-full cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              >
                Browse Files
              </motion.span>

              <p className="text-[#333] text-[11px] mt-4">Supports PDF, DOCX · Max 5MB</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-[#1A1A1A] rounded-2xl p-5 bg-[#050505]"
          >
            {/* File header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-[#F97316]/10 border border-[#F97316]/20 p-3 rounded-xl text-[#F97316] flex-shrink-0">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="font-black text-white truncate text-sm">{file.name}</p>
                  <p className="text-xs text-[#444] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</p>
                </div>
              </div>

              {status === 'idle' && (
                <button
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-[#444] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              {status === 'complete' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-black gap-1.5"
                >
                  <CheckCircle size={14} />
                  Done
                </motion.div>
              )}
            </div>

            {/* Idle: Target Role Selection & analyze button */}
            {status === 'idle' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={14} className="text-[#F97316]" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Select Target Role (Optional)</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COMMON_ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role === selectedRole ? '' : role)}
                        className={`text-[10px] sm:text-xs font-bold px-2 py-2 rounded-lg border transition-all ${
                          selectedRole === role
                            ? 'bg-[#F97316] border-[#F97316] text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                            : 'bg-[#111] border-[#222] text-[#666] hover:text-[#888] hover:border-[#444]'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  className="relative w-full overflow-hidden flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl font-black text-sm text-white bg-[#F97316] transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                >
                  {/* Button shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    animate={{ left: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatDelay: 1.5 }}
                  />
                  <Zap size={16} className="fill-white relative z-10" />
                  <span className="relative z-10">{selectedRole ? `Analyze for ${selectedRole}` : 'Analyze Resume'}</span>
                </motion.button>
              </motion.div>
            )}

            {/* Analyzing */}
            {status === 'analyzing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center text-sm font-bold mb-3">
                  <span className="flex items-center gap-2 text-[#888]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full"
                    />
                    Analyzing intelligence layers...
                  </span>
                  <span className="text-[#F97316]">{progress}%</span>
                </div>
                <div className="w-full bg-[#111] border border-[#1A1A1A] rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #F97316, #FF8C3A)', boxShadow: '0 0 10px rgba(249,115,22,0.5)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-[11px] text-[#444] mt-2">Cross-referencing against 50,000+ placement records...</p>
              </motion.div>
            )}

            {/* Complete */}
            {status === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-green-400 bg-green-500/8 border border-green-500/15 p-3 rounded-xl font-black text-sm"
              >
                <CheckCircle size={16} />
                Analysis complete — generating your career intelligence
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
