import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { ReportData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const ReportGeneration: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('generate');

  // Report generation form
  const [reportForm, setReportForm] = useState({
    type: 'MONTHLY' as 'MONTHLY' | 'YEARLY' | 'CUSTOM',
    dateFrom: '',
    dateTo: '',
    includeFinancial: true,
    includeSubmissions: true,
    includeUsers: true
  });

  // Scheduled reports form
  const [scheduleForm, setScheduleForm] = useState({
    type: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    recipients: [''],
    format: 'PDF' as 'PDF' | 'EXCEL'
  });

  useEffect(() => {
    if (activeTab === 'history') {
      loadReportHistory();
    }
  }, [activeTab]);

  const loadReportHistory = async () => {
    setLoading(true);
    try {
      const reportHistory = await adminService.getReportHistory();
      setReports(reportHistory);
    } catch (error) {
      console.error('Failed to load report history:', error);
      setMessage({ text: 'Failed to load report history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const reportData = await adminService.generateReport(reportForm);
      setMessage({ text: 'Report generated successfully', type: 'success' });
      
      // Switch to history tab to show the new report
      setActiveTab('history');
      loadReportHistory();
    } catch (error) {
      console.error('Failed to generate report:', error);
      setMessage({ text: 'Failed to generate report', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      const blob = await adminService.downloadReport(reportId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
      setMessage({ text: 'Failed to download report', type: 'error' });
    }
  };

  const handleScheduleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty recipients
    const validRecipients = scheduleForm.recipients.filter(email => email.trim() !== '');
    if (validRecipients.length === 0) {
      setMessage({ text: 'Please add at least one recipient email', type: 'error' });
      return;
    }

    try {
      await adminService.scheduleReport({
        ...scheduleForm,
        recipients: validRecipients
      });
      setMessage({ text: 'Report scheduled successfully', type: 'success' });
      
      // Reset form
      setScheduleForm({
        type: 'MONTHLY',
        recipients: [''],
        format: 'PDF'
      });
    } catch (error) {
      console.error('Failed to schedule report:', error);
      setMessage({ text: 'Failed to schedule report', type: 'error' });
    }
  };

  const addRecipient = () => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const removeRecipient = (index: number) => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const getReportTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'info';
      case 'YEARLY': return 'success';
      case 'CUSTOM': return 'warning';
      default: return 'secondary';
    }
  };

  const tabs = [
    { id: 'generate', label: 'Generate Report', icon: '📊' },
    { id: 'schedule', label: 'Schedule Reports', icon: '⏰' },
    { id: 'history', label: 'Report History', icon: '📋' }
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Clean Academic Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 -ml-2"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                Report Generation
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Generate and manage system reports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
          className="mb-6"
        />
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'generate' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900">Generate New Report</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerateReport} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Report Type
                    </label>
                    <select
                      value={reportForm.type}
                      onChange={(e) => setReportForm(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'MONTHLY' | 'YEARLY' | 'CUSTOM'
                      }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="MONTHLY">Monthly Report</option>
                      <option value="YEARLY">Yearly Report</option>
                      <option value="CUSTOM">Custom Date Range</option>
                    </select>
                  </div>

                  {reportForm.type === 'CUSTOM' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Date From
                        </label>
                        <input
                          type="date"
                          value={reportForm.dateFrom}
                          onChange={(e) => setReportForm(prev => ({ ...prev, dateFrom: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Date To
                        </label>
                        <input
                          type="date"
                          value={reportForm.dateTo}
                          onChange={(e) => setReportForm(prev => ({ ...prev, dateTo: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-3">
                    Include Sections
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportForm.includeSubmissions}
                        onChange={(e) => setReportForm(prev => ({ ...prev, includeSubmissions: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                      <span className="ml-2 text-sm text-secondary-700">Submission Statistics</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportForm.includeUsers}
                        onChange={(e) => setReportForm(prev => ({ ...prev, includeUsers: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                      <span className="ml-2 text-sm text-secondary-700">User Activity</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportForm.includeFinancial}
                        onChange={(e) => setReportForm(prev => ({ ...prev, includeFinancial: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                      <span className="ml-2 text-sm text-secondary-700">Financial Data</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={generating}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {generating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {generating ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900">Schedule Automatic Reports</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleScheduleReport} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Report Frequency
                    </label>
                    <select
                      value={scheduleForm.type}
                      onChange={(e) => setScheduleForm(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'MONTHLY' | 'YEARLY'
                      }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Report Format
                    </label>
                    <select
                      value={scheduleForm.format}
                      onChange={(e) => setScheduleForm(prev => ({ 
                        ...prev, 
                        format: e.target.value as 'PDF' | 'EXCEL'
                      }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="PDF">PDF</option>
                      <option value="EXCEL">Excel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Recipients
                  </label>
                  <div className="space-y-2">
                    {scheduleForm.recipients.map((email, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateRecipient(index, e.target.value)}
                          placeholder="Enter email address"
                          className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {scheduleForm.recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      + Add Another Recipient
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Scheduled Report Details</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• Reports will be automatically generated and emailed</div>
                    <div>• Monthly reports are sent on the 1st of each month</div>
                    <div>• Yearly reports are sent on January 1st</div>
                    <div>• You can modify or cancel scheduled reports anytime</div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Schedule Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900">Report History</h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-secondary-600 mt-2">Loading report history...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary-600">No reports generated yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report, index) => (
                    <div key={index} className="border border-secondary-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-secondary-900">
                            {report.title || `${report.type} Report`}
                          </h3>
                          <div className="text-sm text-secondary-600 mt-1">
                            Generated: {new Date(report.createdAt).toLocaleString()}
                          </div>
                          <div className="text-sm text-secondary-600">
                            Period: {report.period}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getReportTypeBadgeVariant(report.type)}>
                            {report.type}
                          </Badge>
                          <Badge variant="success">
                            {report.status || 'COMPLETED'}
                          </Badge>
                        </div>
                      </div>

                      {report.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="font-medium text-blue-900">Submissions</div>
                            <div className="text-blue-700">
                              Total: {report.summary.submissions?.total || 0}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <div className="font-medium text-green-900">Users</div>
                            <div className="text-green-700">
                              Active: {report.summary.users?.active || 0}
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded">
                            <div className="font-medium text-purple-900">Revenue</div>
                            <div className="text-purple-700">
                              ${report.summary.financial?.revenue?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownloadReport(report.id, 'PDF')}
                          className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.id, 'EXCEL')}
                          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Download Excel
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.id, 'CSV')}
                          className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                        >
                          Download CSV
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ReportGeneration;