import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Mail, Send } from 'lucide-react';

interface ContactFormProps {
  type?: 'general' | 'report' | 'typo';
  articleId?: string;
  articleTitle?: string;
  onClose?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  type = 'general', 
  articleId, 
  articleTitle,
  onClose 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    issueType: type === 'report' ? 'ethical' : 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock API call - replace with actual contact service
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Message Sent Successfully
          </h3>
          <p className="text-secondary-600 mb-4">
            Thank you for contacting us. We'll get back to you within 24-48 hours.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const getTitle = () => {
    switch (type) {
      case 'report':
        return 'Report an Issue';
      case 'typo':
        return 'Report a Typo';
      default:
        return 'Contact Us';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'report':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'typo':
        return <MessageSquare className="h-5 w-5 text-orange-600" />;
      default:
        return <Mail className="h-5 w-5 text-primary-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-lg mx-auto">
      <div className="flex items-center mb-4">
        {getIcon()}
        <h3 className="text-lg font-medium text-secondary-900 ml-2">
          {getTitle()}
        </h3>
      </div>

      {articleTitle && (
        <div className="bg-secondary-50 p-3 rounded-md mb-4">
          <p className="text-sm text-secondary-700">
            <strong>Article:</strong> {articleTitle}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        {type === 'report' && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Issue Type *
            </label>
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="ethical">Ethical Concern</option>
              <option value="plagiarism">Plagiarism</option>
              <option value="data">Data Issues</option>
              <option value="authorship">Authorship Dispute</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder={type === 'typo' ? 'Typo in article' : 'Brief description of your inquiry'}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Message *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            placeholder={
              type === 'typo' 
                ? 'Please describe the typo and its location in the article...'
                : type === 'report'
                ? 'Please provide detailed information about the issue...'
                : 'Your message...'
            }
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="border border-secondary-300 text-secondary-700 px-6 py-2 rounded-md hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {type === 'report' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> All reports are taken seriously and will be investigated according to our editorial policies. 
            Your identity will be kept confidential during the investigation process.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactForm;