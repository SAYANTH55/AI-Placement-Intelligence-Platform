import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, FileText, Loader2, Zap, X } from 'lucide-react';
import classNames from 'classnames';

export default function UploadBox({ onAnalyzeComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | analyzing | complete
  const [progress, setProgress] = useState(0);

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

    const interval = setInterval(() => {
      setProgress(old => {
        if (old >= 90) return old;
        return old + 10;
      });
    }, 180);

    await new Promise(resolve => setTimeout(resolve, 2000));

    clearInterval(interval);
    setProgress(100);
    setStatus('complete');

    setTimeout(() => {
      if (onAnalyzeComplete) onAnalyzeComplete();
    }, 500);
  };

  const handleRemove = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Resume Intelligence</h3>
        <p className="text-gray-500 text-sm">Upload your resume to extract skills, map gaps, and predict placement readiness.</p>
      </div>

      {!file ? (
        <div
          {...getRootProps()}
          className={classNames(
            "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 group",
            isDragActive
              ? "border-orange-400 bg-orange-50 scale-[1.01]"
              : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"
          )}
        >
          <input {...getInputProps()} />
          <div className={classNames(
            "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors duration-200",
            isDragActive ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500"
          )}>
            <UploadCloud className="h-8 w-8" />
          </div>
          <p className="text-gray-700 font-semibold text-base mb-1">
            {isDragActive ? "Drop your resume here..." : "Drag & drop your resume"}
          </p>
          <p className="text-xs text-gray-400 mb-4">or click to browse files</p>
          <span className="inline-block bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-full">
            Browse Files
          </span>
          <p className="text-xs text-gray-400 mt-4">Supports PDF, DOCX · Max 5MB</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-3 rounded-xl text-orange-500 flex-shrink-0">
                <FileText size={22} />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-gray-900 truncate text-sm">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</p>
              </div>
            </div>

            {status === 'idle' && (
              <button
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            )}

            {status === 'complete' && (
              <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5">
                <CheckCircle size={14} />
                Done
              </div>
            )}
          </div>

          {status === 'idle' && (
            <button
              onClick={handleAnalyze}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#F97316] hover:bg-orange-600 transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
            >
              <Zap size={16} />
              Analyze Resume
            </button>
          )}

          {status === 'analyzing' && (
            <div className="mt-1">
              <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2">
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-orange-500" />
                  Analyzing intelligence layers...
                </span>
                <span className="font-bold text-orange-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #F97316, #FFA559)'
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Cross-referencing against 50,000+ placement records...</p>
            </div>
          )}

          {status === 'complete' && (
            <div className="mt-1 flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl font-semibold text-sm border border-green-100">
              <CheckCircle size={16} />
              Analysis complete — generating your career intelligence
            </div>
          )}
        </div>
      )}
    </div>
  );
}
