import React, { useState } from 'react';
import { Bell, Mail, Check } from 'lucide-react';

interface SubscriptionAlertProps {
  type: 'issue' | 'journal';
  title?: string;
  className?: string;
}

const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({ 
  type, 
  title, 
  className = '' 
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    
    // Mock API call - replace with actual subscription service
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubscribed(true);
      setShowForm(false);
      setEmail('');
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md ${className}`}>
        <Check className="h-4 w-4 mr-2" />
        Subscribed to alerts
      </div>
    );
  }

  if (showForm) {
    return (
      <div className={`bg-white border border-secondary-200 rounded-lg p-4 shadow-sm ${className}`}>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          {type === 'issue' ? 'Get notified of new issues' : 'Follow this journal'}
        </h3>
        <p className="text-secondary-600 text-sm mb-4">
          {type === 'issue' 
            ? 'Receive email notifications when new issues are published'
            : 'Stay updated with the latest research and publications'
          }
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-secondary-300 text-secondary-700 px-4 py-2 rounded-md hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        <p className="text-xs text-secondary-500 mt-2">
          You can unsubscribe at any time. We respect your privacy.
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className={`inline-flex items-center px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 transition-colors ${className}`}
    >
      <Bell className="h-4 w-4 mr-2" />
      {type === 'issue' ? 'Alert me' : 'Follow Journal'}
    </button>
  );
};

export default SubscriptionAlert;