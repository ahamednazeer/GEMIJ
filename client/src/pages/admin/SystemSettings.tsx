import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { SystemSettings as SystemSettingsType } from '@/services/adminService';
import Alert from '@/components/ui/Alert';

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsData = await adminService.getSystemSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ text: 'Failed to load system settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const updatedSettings = await adminService.updateSystemSettings(settings);
      setSettings(updatedSettings);
      setMessage({ text: 'Settings saved successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ text: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const defaultSettings = await adminService.resetSettingsToDefault();
      setSettings(defaultSettings);
      setMessage({ text: 'Settings reset to defaults successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage({ text: 'Failed to reset settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettingsType, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'workflow', label: 'Workflow', icon: '🔄' },
    { id: 'content', label: 'Content', icon: '📝' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-secondary-600">Failed to load settings.</p>
          <button
            onClick={loadSettings}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">System Settings</h1>
          <p className="text-secondary-600 mt-1">Configure journal settings and policies</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-4 py-2 text-secondary-600 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
          className="mb-6"
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <div className="card">
            <div className="card-body p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <form onSubmit={handleSaveSettings}>
            <div className="card">
              <div className="card-body">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">General Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Journal Name
                        </label>
                        <input
                          type="text"
                          value={settings.journalName}
                          onChange={(e) => updateSetting('journalName', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) => updateSetting('contactEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Journal Description
                      </label>
                      <textarea
                        value={settings.journalDescription}
                        onChange={(e) => updateSetting('journalDescription', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'financial' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">Financial Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Article Processing Charge (APC)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-secondary-500">$</span>
                          <input
                            type="number"
                            value={settings.apcFee}
                            onChange={(e) => updateSetting('apcFee', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => updateSetting('currency', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'workflow' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">Workflow Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Review Deadline (Days)
                        </label>
                        <input
                          type="number"
                          value={settings.reviewDeadlineDays}
                          onChange={(e) => updateSetting('reviewDeadlineDays', parseInt(e.target.value))}
                          min="1"
                          max="365"
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Revision Deadline (Days)
                        </label>
                        <input
                          type="number"
                          value={settings.revisionDeadlineDays}
                          onChange={(e) => updateSetting('revisionDeadlineDays', parseInt(e.target.value))}
                          min="1"
                          max="365"
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Maximum Reviewers per Submission
                        </label>
                        <input
                          type="number"
                          value={settings.maxReviewers}
                          onChange={(e) => updateSetting('maxReviewers', parseInt(e.target.value))}
                          min="1"
                          max="10"
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Plagiarism Threshold (%)
                        </label>
                        <input
                          type="number"
                          value={settings.plagiarismThreshold}
                          onChange={(e) => updateSetting('plagiarismThreshold', parseInt(e.target.value))}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoAssignReviewers"
                        checked={settings.autoAssignReviewers}
                        onChange={(e) => updateSetting('autoAssignReviewers', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                      <label htmlFor="autoAssignReviewers" className="ml-2 block text-sm text-secondary-700">
                        Enable automatic reviewer assignment
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">Content Guidelines</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Submission Guidelines
                      </label>
                      <textarea
                        value={settings.submissionGuidelines}
                        onChange={(e) => updateSetting('submissionGuidelines', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter detailed submission guidelines for authors..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Review Guidelines
                      </label>
                      <textarea
                        value={settings.reviewGuidelines}
                        onChange={(e) => updateSetting('reviewGuidelines', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter guidelines for reviewers..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Ethics Policy
                      </label>
                      <textarea
                        value={settings.ethicsPolicy}
                        onChange={(e) => updateSetting('ethicsPolicy', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter ethics and publication policies..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">Notification Settings</h2>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-secondary-700">
                        Enable email notifications
                      </label>
                    </div>

                    <div className="bg-secondary-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-secondary-900 mb-2">Email Notification Types</h3>
                      <div className="space-y-2 text-sm text-secondary-600">
                        <div>• New submission notifications to editors</div>
                        <div>• Review invitation emails to reviewers</div>
                        <div>• Review deadline reminders</div>
                        <div>• Decision notifications to authors</div>
                        <div>• Payment confirmation emails</div>
                        <div>• System alerts to administrators</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-secondary-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;