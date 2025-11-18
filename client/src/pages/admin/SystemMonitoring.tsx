import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { SystemHealthData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';

const SystemMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [submissionStats, setSubmissionStats] = useState<any>(null);
  const [userActivityStats, setUserActivityStats] = useState<any>(null);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [logFilters, setLogFilters] = useState({
    level: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    loadSystemData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadSystemLogs();
    }
  }, [activeTab, logFilters]);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      const [health, submissions, users, financial] = await Promise.all([
        adminService.getSystemHealth(),
        adminService.getSubmissionStats('MONTHLY'),
        adminService.getUserActivityStats('MONTHLY'),
        adminService.getFinancialStats('MONTHLY')
      ]);
      
      setSystemHealth(health);
      setSubmissionStats(submissions);
      setUserActivityStats(users);
      setFinancialStats(financial);
    } catch (error) {
      console.error('Failed to load system data:', error);
      setMessage({ text: 'Failed to load system monitoring data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemLogs = async () => {
    try {
      const { logs } = await adminService.getSystemLogs(logFilters);
      setSystemLogs(logs);
    } catch (error) {
      console.error('Failed to load system logs:', error);
      setMessage({ text: 'Failed to load system logs', type: 'error' });
    }
  };

  const handleBackup = async () => {
    if (!confirm('Are you sure you want to perform a system backup? This may take several minutes.')) {
      return;
    }

    try {
      await adminService.performSystemBackup();
      setMessage({ text: 'System backup initiated successfully', type: 'success' });
      // Reload system health to update backup status
      setTimeout(loadSystemData, 2000);
    } catch (error) {
      console.error('Failed to perform backup:', error);
      setMessage({ text: 'Failed to initiate system backup', type: 'error' });
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      case 'DEBUG': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'logs', label: 'System Logs', icon: '📋' }
  ];

  if (loading && !systemHealth) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading system monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">System Monitoring</h1>
          <p className="text-secondary-600 mt-1">Monitor system health, performance, and analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBackup}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Perform Backup
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

      {/* System Health Status */}
      {systemHealth && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">System Health</h2>
              <div className={`flex items-center space-x-2 ${getHealthStatusColor(systemHealth.status)}`}>
                <span className="text-2xl">{getHealthStatusIcon(systemHealth.status)}</span>
                <span className="font-medium capitalize">{systemHealth.status}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatUptime(systemHealth.uptime)}</div>
                <div className="text-sm text-secondary-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.activeUsers}</div>
                <div className="text-sm text-secondary-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemHealth.serverLoad.toFixed(1)}%</div>
                <div className="text-sm text-secondary-600">Server Load</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemHealth.responseTime}ms</div>
                <div className="text-sm text-secondary-600">Response Time</div>
              </div>
            </div>
          </div>
        </div>
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
        {activeTab === 'overview' && systemHealth && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Resource Usage</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{systemHealth.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          systemHealth.memoryUsage > 80 ? 'bg-red-600' :
                          systemHealth.memoryUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${systemHealth.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disk Usage</span>
                      <span>{systemHealth.diskUsage}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          systemHealth.diskUsage > 80 ? 'bg-red-600' :
                          systemHealth.diskUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${systemHealth.diskUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Error Rate</span>
                      <span>{systemHealth.errorRate}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          systemHealth.errorRate > 5 ? 'bg-red-600' :
                          systemHealth.errorRate > 2 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(systemHealth.errorRate * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">System Information</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Database Size:</span>
                    <span className="font-medium">{systemHealth.databaseSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Last Backup:</span>
                    <span className="font-medium">
                      {new Date(systemHealth.lastBackup).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Active Users:</span>
                    <span className="font-medium">{systemHealth.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Server Load:</span>
                    <span className="font-medium">{systemHealth.serverLoad.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Response Time:</span>
                    <span className="font-medium">{systemHealth.responseTime}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && systemHealth && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Performance Metrics</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{systemHealth.responseTime}ms</div>
                    <div className="text-sm text-secondary-600">Average Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{(100 - systemHealth.errorRate).toFixed(1)}%</div>
                    <div className="text-sm text-secondary-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{systemHealth.activeUsers}</div>
                    <div className="text-sm text-secondary-600">Concurrent Users</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Resource Utilization</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span>{systemHealth.serverLoad.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${systemHealth.serverLoad}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory</span>
                      <span>{systemHealth.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full"
                        style={{ width: `${systemHealth.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Storage</span>
                      <span>{systemHealth.diskUsage}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full"
                        style={{ width: `${systemHealth.diskUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">System Status</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Overall Health</span>
                    <span className={`text-sm font-medium ${getHealthStatusColor(systemHealth.status)}`}>
                      {systemHealth.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Database</span>
                    <span className="text-sm font-medium text-green-600">CONNECTED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">File System</span>
                    <span className="text-sm font-medium text-green-600">ACCESSIBLE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Email Service</span>
                    <span className="text-sm font-medium text-green-600">OPERATIONAL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Backup System</span>
                    <span className="text-sm font-medium text-green-600">READY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {submissionStats && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-secondary-900">Submission Analytics</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {submissionStats.totalSubmissions || 0}
                        </div>
                        <div className="text-sm text-secondary-600">Total Submissions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {submissionStats.acceptedSubmissions || 0}
                        </div>
                        <div className="text-sm text-secondary-600">Accepted</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-secondary-900">
                        Acceptance Rate: {submissionStats.acceptanceRate || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userActivityStats && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-secondary-900">User Activity</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {userActivityStats.activeUsers || 0}
                        </div>
                        <div className="text-sm text-secondary-600">Active Users</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {userActivityStats.newRegistrations || 0}
                        </div>
                        <div className="text-sm text-secondary-600">New Registrations</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Log Filters */}
            <div className="card">
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Log Level
                    </label>
                    <select
                      value={logFilters.level}
                      onChange={(e) => setLogFilters(prev => ({ ...prev, level: e.target.value, page: 1 }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Levels</option>
                      <option value="ERROR">Error</option>
                      <option value="WARN">Warning</option>
                      <option value="INFO">Info</option>
                      <option value="DEBUG">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={logFilters.dateFrom}
                      onChange={(e) => setLogFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={logFilters.dateTo}
                      onChange={(e) => setLogFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Items per page
                    </label>
                    <select
                      value={logFilters.limit}
                      onChange={(e) => setLogFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* System Logs */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">System Logs</h3>
              </div>
              <div className="card-body p-0">
                {systemLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary-600">No logs found.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {systemLogs.map((log, index) => (
                      <div key={index} className="px-6 py-3 border-b border-secondary-100 hover:bg-secondary-50">
                        <div className="flex items-start space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                            {log.level}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm text-secondary-900">{log.message}</div>
                            <div className="text-xs text-secondary-500 mt-1">
                              {new Date(log.timestamp).toLocaleString()}
                              {log.source && ` • ${log.source}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitoring;