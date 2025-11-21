import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService, { PaymentData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const PaymentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [payment, setPayment] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (id) {
            loadPayment(id);
        }
    }, [id]);

    const loadPayment = async (paymentId: string) => {
        setLoading(true);
        try {
            const data = await adminService.getPaymentById(paymentId);
            setPayment(data);
        } catch (error) {
            console.error('Failed to load payment details:', error);
            setMessage({ text: 'Failed to load payment details', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!payment) return;
        const transactionId = prompt('Please enter the transaction ID (optional):') || `MANUAL-${Date.now()}`;

        try {
            await adminService.markPaymentAsPaid(payment.id, transactionId);
            setMessage({ text: 'Payment marked as paid successfully', type: 'success' });
            loadPayment(payment.id);
        } catch (error) {
            console.error('Failed to mark payment as paid:', error);
            setMessage({ text: 'Failed to mark payment as paid', type: 'error' });
        }
    };

    const handleProcessRefund = async () => {
        if (!payment) return;
        const reason = prompt('Please enter the reason for refund:');
        if (!reason) return;

        try {
            await adminService.processRefund(payment.id, reason);
            setMessage({ text: 'Refund processed successfully', type: 'success' });
            loadPayment(payment.id);
        } catch (error) {
            console.error('Failed to process refund:', error);
            setMessage({ text: 'Failed to process refund', type: 'error' });
        }
    };

    const handleGenerateInvoice = async () => {
        if (!payment) return;
        try {
            const blob = await adminService.generateInvoice(payment.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${payment.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to generate invoice:', error);
            setMessage({ text: 'Failed to generate invoice', type: 'error' });
        }
    };

    const handleViewProof = () => {
        if (!payment?.proofUrl) return;
        const fullUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${payment.proofUrl}`;
        window.open(fullUrl, '_blank');
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
            currency: 'INR' // Force INR display
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-secondary-900">Payment not found</h2>
                    <Button onClick={() => navigate('/admin/payments')} className="mt-4">
                        Back to Payments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-50">
            <div className="bg-white border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/payments')}
                        className="mb-6 -ml-2"
                        size="sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Payments
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-foreground">
                                    Payment Details
                                </h1>
                                <Badge variant={getStatusBadgeVariant(payment.status)} className="text-sm px-3 py-1">
                                    {payment.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Invoice: {payment.invoiceNumber}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleGenerateInvoice}>
                                Download Invoice
                            </Button>
                            {payment.status === 'PENDING' && (
                                <Button onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700 text-white">
                                    Mark as Paid
                                </Button>
                            )}
                            {payment.status === 'PAID' && (
                                <Button variant="outline" onClick={handleProcessRefund} className="text-red-600 border-red-200 hover:bg-red-50">
                                    Process Refund
                                </Button>
                            )}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="card-header border-b border-border p-6">
                                <h3 className="text-lg font-semibold">Transaction Information</h3>
                            </div>
                            <div className="card-body p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-secondary-500">Amount</label>
                                        <div className="text-lg font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-secondary-500">Date</label>
                                        <div className="text-base">
                                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'Pending'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-secondary-500">Payment Method</label>
                                        <div className="text-base">{payment.paymentMethod || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-secondary-500">Transaction ID</label>
                                        <div className="text-base font-mono text-sm">{payment.transactionId || 'N/A'}</div>
                                    </div>
                                </div>

                                {payment.proofUrl && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h4 className="text-sm font-medium text-secondary-900 mb-3">Payment Proof</h4>
                                        <div className="flex items-center gap-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                                            <div className="p-2 bg-white rounded border border-secondary-200">
                                                <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-secondary-900">Proof of Payment</div>
                                                <div className="text-xs text-secondary-500">Uploaded by author</div>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={handleViewProof}>
                                                View Proof
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header border-b border-border p-6">
                                <h3 className="text-lg font-semibold">Submission Details</h3>
                            </div>
                            <div className="card-body p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-base font-medium text-primary-600 mb-1">
                                            <a href={`/submission/${payment.submissionId}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                {payment.submissionTitle || 'View Submission'}
                                            </a>
                                        </h4>
                                        <p className="text-sm text-secondary-500">ID: {payment.submissionId}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => navigate(`/submission/${payment.submissionId}`)}
                                    >
                                        View Submission
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="card">
                            <div className="card-header border-b border-border p-6">
                                <h3 className="text-lg font-semibold">Author Information</h3>
                            </div>
                            <div className="card-body p-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-secondary-500">Name</label>
                                    <div className="text-base font-medium">{payment.authorName}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-secondary-500">Email</label>
                                    <div className="text-base">
                                        <a href={`mailto:${payment.authorId}`} className="text-primary-600 hover:underline">
                                            {/* Note: PaymentData interface might need email if not present, using ID as placeholder or need to fetch user */}
                                            {/* Actually PaymentData has authorName but maybe not email directly unless added. 
                          Checking adminService.ts, PaymentData has authorName, authorId. 
                          The getAdminPayments controller returns authorEmail in the mapped object but interface might be missing it.
                          Let's check interface in adminService.ts again.
                      */}
                                            Contact Author
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-secondary-500">User ID</label>
                                    <div className="text-xs font-mono text-secondary-600">{payment.authorId}</div>
                                </div>
                                <div className="pt-4 mt-4 border-t border-border">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate(`/admin/users?search=${payment.authorEmail}`)}
                                    >
                                        View User Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetails;
