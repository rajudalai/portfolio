import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

interface ContactContent {
  header: { title: string; subtitle: string; };
  form: {
    nameLabel: string; namePlaceholder: string;
    emailLabel: string; emailPlaceholder: string;
    channelLabel: string; channelPlaceholder: string;
    visionLabel: string; visionOptions: string;
    servicesLabel: string; services: string;
    messageLabel: string; messagePlaceholder: string;
    submitButton: string; responseTime: string;
  };
  success: { title: string; message: string; backButton: string; };
}

// Default API URL - can be overridden from admin settings
const DEFAULT_API_URL = 'http://localhost:8000/api/contact';

const ContactForm: React.FC<{ content: ContactContent }> = ({ content }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email settings from Firebase
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  // Fetch email settings on mount
  useEffect(() => {
    const fetchEmailSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'email');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEmailEnabled(data.enabled !== false);
          if (data.apiUrl && data.apiUrl.trim() !== '') {
            setApiUrl(data.apiUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching email settings:', err);
      }
    };
    fetchEmailSettings();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    channel: '',
    vision: '',
    selectedServices: [] as string[],
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: checked
        ? [...prev.selectedServices, service]
        : prev.selectedServices.filter(s => s !== service)
    }));
  };

  // Fire-and-forget email sending - updates Firebase doc with result later
  const sendEmailAsync = async (
    submissionDocId: string,
    payload: {
      from_name: string;
      from_email: string;
      subject: string;
      message: string;
      email_enabled: boolean;
    }
  ) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Update the Firebase doc with the API response
      const submissionRef = doc(db, 'contactSubmissions', submissionDocId);

      if (data.skipped) {
        await updateDoc(submissionRef, {
          status: 'skipped',
          apiResponse: data
        });
      } else if (!response.ok || !data.success) {
        await updateDoc(submissionRef, {
          status: 'failed',
          apiResponse: data
        });
      } else {
        await updateDoc(submissionRef, {
          status: 'sent',
          apiResponse: data
        });
      }
    } catch (err) {
      // Update Firebase with error status
      try {
        const submissionRef = doc(db, 'contactSubmissions', submissionDocId);
        await updateDoc(submissionRef, {
          status: 'failed',
          apiResponse: { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
        });
      } catch (updateErr) {
        console.error('Failed to update submission status:', updateErr);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Store form data before any async operations
    const submissionData = {
      name: formData.name,
      email: formData.email,
      channel: formData.channel,
      vision: formData.vision,
      selectedServices: [...formData.selectedServices],
      message: formData.message
    };

    try {
      // Build the message with all form details
      const servicesText = formData.selectedServices.length > 0
        ? `\n\nServices Requested:\n${formData.selectedServices.map(s => `• ${s}`).join('\n')}`
        : '';

      const visionText = formData.vision ? `\n\nVision: ${formData.vision}` : '';
      const channelText = formData.channel ? `\n\nChannel/Link: ${formData.channel}` : '';

      const fullMessage = `${formData.message}${channelText}${visionText}${servicesText}`;

      // FIRST: Save to Firebase immediately with 'pending' status
      const docRef = await addDoc(collection(db, 'contactSubmissions'), {
        name: submissionData.name,
        email: submissionData.email,
        channel: submissionData.channel,
        vision: submissionData.vision,
        selectedServices: submissionData.selectedServices,
        message: submissionData.message,
        submittedAt: Timestamp.now(),
        apiResponse: { success: false, message: 'Pending...' },
        status: emailEnabled ? 'pending' : 'skipped'  // If emails disabled, mark as skipped immediately
      });

      // Show success immediately - don't wait for email API
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        channel: '',
        vision: '',
        selectedServices: [],
        message: ''
      });

      // THEN: Fire-and-forget the email API call (runs in background)
      if (emailEnabled) {
        // Don't await this - let it run in background
        sendEmailAsync(docRef.id, {
          from_name: submissionData.name,
          from_email: submissionData.email,
          subject: `New Contact Form Submission from ${submissionData.name}`,
          message: fullMessage,
          email_enabled: emailEnabled
        });
      }

    } catch (err) {
      console.error('Error saving submission:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse comma-separated options and services
  const visionOptions = content.form.visionOptions ? content.form.visionOptions.split(',').map(o => o.trim()) : ['Just getting started', 'Growing consistently', 'Scaling aggressively', 'Not sure yet'];
  const services = content.form.services ? content.form.services.split(',').map(s => s.trim()) : ['Video editing for YouTube', 'Reels & short-form content', 'Thumbnails & graphic design', 'Motion graphics / intro animation', 'Full content package', 'Something else'];

  if (submitted) {
    return (
      <div id="contact" className="max-w-6xl mx-auto py-24 text-center px-6">
        <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-6 text-neon">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-4">{content.success.title}</h2>
        <p className="text-gray-400 text-lg">{content.success.message}</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 text-neon text-sm underline underline-offset-4 hover:text-neon-hover"
        >
          {content.success.backButton}
        </button>
      </div>
    );
  }

  return (
    <section id="contact" className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">{content.header.title}</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {content.header.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-dark-card/50 p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl">

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-300 ml-1">{content.form.nameLabel}</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={content.form.namePlaceholder}
              className="w-full bg-[#070707] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-300 ml-1">{content.form.emailLabel}</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={content.form.emailPlaceholder}
              className="w-full bg-[#070707] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Row 2: Channel Link */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-300 ml-1">{content.form.channelLabel}</label>
          <input
            type="url"
            name="channel"
            value={formData.channel}
            onChange={handleInputChange}
            placeholder={content.form.channelPlaceholder}
            className="w-full bg-[#070707] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Row 3: Vision Dropdown */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-300 ml-1">{content.form.visionLabel}</label>
          <div className="relative">
            <select
              name="vision"
              value={formData.vision}
              onChange={handleInputChange}
              className="w-full bg-[#070707] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="">Select an option...</option>
              {visionOptions.map((option, i) => (
                <option key={i} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
          </div>
        </div>

        {/* Row 4 - Checkboxes (Services) */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-300 ml-1">{content.form.servicesLabel}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <label key={service} className="flex items-center gap-4 p-4 rounded-xl bg-[#070707] border border-white/5 hover:border-white/20 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={formData.selectedServices.includes(service)}
                  onChange={(e) => handleCheckboxChange(service, e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-neon focus:ring-neon bg-transparent accent-neon"
                  disabled={isLoading}
                />
                <span className="text-base text-gray-400 group-hover:text-white transition-colors font-medium">{service}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Row 5: Textarea */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-300 ml-1">{content.form.messageLabel}</label>
          <textarea
            rows={6}
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder={content.form.messagePlaceholder}
            className="w-full bg-[#070707] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Submit */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-gray-500 order-2 md:order-1">{content.form.responseTime}</p>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto order-1 md:order-2 px-10 py-4 bg-white text-black rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_15px_rgba(138,99,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>{content.form.submitButton}</span>
                <Send size={18} />
              </>
            )}
          </button>
        </div>

      </form>
    </section>
  );
};

export default ContactForm;