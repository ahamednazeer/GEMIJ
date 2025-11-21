import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { PaymentData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const PaymentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await adminService.getSystemSettings();
        if (settings?.currency) {
          setCurrency(settings.currency);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { payments: paymentData, pagination: paginationData } = await adminService.getAllPayments(filters);
      setPayments(paymentData);
      setPagination(paginationData);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setMessage({ text: 'Failed to load payments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (paymentId: string) => {
    const reason = prompt('Please enter the reason for refund:');
    if (!reason) return;

    try {
      await adminService.processRefund(paymentId, reason);
      setMessage({ text: 'Refund processed successfully', type: 'success' });
      loadPayments();
    } catch (error) {
      console.error('Failed to process refund:', error);
      setMessage({ text: 'Failed to process refund', type: 'error' });
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    const transactionId = prompt('Please enter the transaction ID (optional):') || `MANUAL-${Date.now()}`;

    try {
      await adminService.markPaymentAsPaid(paymentId, transactionId);
      setMessage({ text: 'Payment marked as paid successfully', type: 'success' });
      loadPayments();
    } catch (error) {
      console.error('Failed to mark payment as paid:', error);
      setMessage({ text: 'Failed to mark payment as paid', type: 'error' });
    }
  };

  const handleViewProof = (proofUrl: string) => {
    // Construct full URL if needed, assuming proofUrl is relative path from upload middleware
    // In a real app, you might need a specific endpoint to serve secure files
    const fullUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${proofUrl}`;
    window.open(fullUrl, '_blank');
  };

  const handleGenerateInvoice = async (paymentId: string) => {
    try {
      const blob = await adminService.generateInvoice(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      setMessage({ text: 'Failed to generate invoice', type: 'error' });
    }
  };

  const handleBulkAction = async (action: 'REFUND' | 'MARK_PAID') => {
    if (selectedPayments.length === 0) {
      setMessage({ text: 'Please select payments to process', type: 'error' });
      return;
    }

    const confirmMessage = action === 'REFUND'
      ? `Are you sure you want to refund ${selectedPayments.length} payments?`
      : `Are you sure you want to mark ${selectedPayments.length} payments as paid?`;

    if (!confirm(confirmMessage)) return;

    try {
      await adminService.bulkProcessPayments(selectedPayments, action);
      setMessage({
        text: `${selectedPayments.length} payments processed successfully`,
        type: 'success'
      });
      setSelectedPayments([]);
      loadPayments();
    } catch (error) {
      console.error('Failed to process bulk payments:', error);
      setMessage({ text: 'Failed to process payments', type: 'error' });
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedPayments(prev =>
      prev.length === payments.length ? [] : payments.map(payment => payment.id)
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'REFUNDED': return 'info';
      case 'FAILED': return 'error';
      default: return 'neutral';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

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
                Payment Management
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Manage APC payments, invoices, and refunds
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {message && (
          <Alert
            variant={message.type}
            title={message.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setMessage(null)}
            className="mb-6"
          >
            {message.text}
          </Alert>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Items per page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {payments.filter(p => p.status === 'PAID').length}
              </div>
              <div className="text-sm text-secondary-600">Paid</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {payments.filter(p => p.status === 'PENDING').length}
              </div>
              <div className="text-sm text-secondary-600">Pending</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {payments.filter(p => p.status === 'REFUNDED').length}
              </div>
              <div className="text-sm text-secondary-600">Refunded</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
                  currency
                )}
              </div>
              <div className="text-sm text-secondary-600">Total Revenue</div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPayments.length > 0 && (
          <div className="card mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">
                  {selectedPayments.length} payment{selectedPayments.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('MARK_PAID')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => handleBulkAction('REFUND')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    Process Refunds
                  </button>
                  <button
                    onClick={() => setSelectedPayments([])}
                    className="px-3 py-1 text-sm text-secondary-600 hover:text-secondary-800"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="card">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-secondary-600 mt-2">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-600">No payments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPayments.length === payments.length}
                          onChange={toggleSelectAll}
                          className="rounded border-secondary-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPayments.includes(payment.id)}
                            onChange={() => togglePaymentSelection(payment.id)}
                            className="rounded border-secondary-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-secondary-900">
                            {payment.invoiceNumber}
                          </div>
                          <div className="text-sm text-secondary-500">
                            Submission: {payment.submissionId.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-secondary-900">
                            {payment.authorName}
                          </div>
                          <div className="text-sm text-secondary-500">
                            ID: {payment.authorId.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-secondary-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          {payment.paymentMethod && (
                            <div className="text-sm text-secondary-500">
                              {payment.paymentMethod}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                          {payment.proofUrl && payment.status === 'PENDING' && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Proof Uploaded
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-500">
                          {payment.paymentDate ? (
                            <div>
                              <div>Paid: {new Date(payment.paymentDate).toLocaleDateString()}</div>
                              {payment.transactionId && (
                                <div className="text-xs">TX: {payment.transactionId}</div>
                              )}
                            </div>
                          ) : payment.refundDate ? (
                            <div>Refunded: {new Date(payment.refundDate).toLocaleDateString()}</div>
                          ) : (
                            'Pending'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-wrap gap-1">


                            {payment.proofUrl && (
                              <button
                                onClick={() => handleViewProof(payment.proofUrl!)}
                                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                              >
                                View Proof
                              </button>
                            )}

                            {payment.status === 'PENDING' && (
                              <button
                                onClick={() => handleMarkAsPaid(payment.id)}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Mark Paid
                              </button>
                            )}

                            {payment.status === 'PAID' && (
                              <button
                                onClick={() => handleProcessRefund(payment.id)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Refund
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/admin/payments/${payment.id}`)}
                              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => window.open(`/invoice/${payment.id}`, '_blank')}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                              title="View Invoice"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-secondary-600">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
              {pagination.total} payments
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={filters.page === 1}
                className="px-3 py-1 border border-secondary-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + Math.max(1, filters.page - 2);
                return (
                  <button
                    key={page}
                    onClick={() => setFilters(prev => ({ ...prev, page }))}
                    className={`px-3 py-1 border rounded text-sm ${page === filters.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-secondary-300 hover:bg-secondary-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={filters.page === pagination.totalPages}
                className="px-3 py-1 border border-secondary-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;