import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  const contacts = [
    { icon: <Mail size={20} />, label: 'Email', value: 'contact@aiplacement.io', color: 'bg-blue-50 text-blue-600' },
    { icon: <MessageSquare size={20} />, label: 'Support', value: 'Available 9am–6pm IST', color: 'bg-green-50 text-green-600' },
    { icon: <MapPin size={20} />, label: 'Location', value: 'Bengaluru, India', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="min-h-[90vh] bg-[#F9FAFB] px-4 sm:px-8 py-16 animate-fade-in">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Mail size={14} />
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Contact <span className="text-[#F97316]">Us</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Interested in partnering or bringing our AI placement platform to your university? Reach out — we'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Info */}
          <div className="lg:col-span-2 space-y-5">
            {contacts.map((c, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{c.value}</p>
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-br from-[#F97316] to-[#FFA559] rounded-2xl p-6 text-white shadow-md">
              <h3 className="font-bold text-base mb-1">For Universities</h3>
              <p className="text-sm opacity-85 leading-relaxed">We offer institutional licensing and batch onboarding for placement cells. Get in touch for a custom demo.</p>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">We'll get back to you within 1–2 business days.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Priya Sharma"
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@university.edu"
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                    <textarea
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your institution or what you're looking for..."
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 bg-[#F97316] text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-colors duration-200 text-sm shadow-sm hover:shadow-md"
                  >
                    <Send size={16} />
                    Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
