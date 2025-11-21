import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { publicService } from '@/services/publicService';
import { PaymentData } from '@/services/adminService';

const Invoice: React.FC = () => {
    const { paymentId } = useParams<{ paymentId: string }>();
    const navigate = useNavigate();
    const [payment, setPayment] = useState<PaymentData | null>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [paymentData, settingsData] = await Promise.all([
                    paymentService.getPaymentById(paymentId!),
                    publicService.getPublicSettings()
                ]);
                setPayment(paymentData as unknown as PaymentData); // Ensure type compatibility
                setSettings(settingsData);
            } catch (error) {
                console.error('Error loading invoice data:', error);
                setError('Failed to load invoice details');
            } finally {
                setLoading(false);
            }
        };

        if (paymentId) {
            loadData();
        }
    }, [paymentId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !payment) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                        <p className="text-gray-600">{error || 'Invoice not found'}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAmount = (amount: number) => {
        const currency = payment.currency || 'INR';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-secondary-50 py-8 print:bg-white print:py-0">
            {/* Print Controls - Hidden when printing */}
            <div className="max-w-4xl mx-auto mb-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center no-print">
                <button
                    onClick={() => navigate(-1)}
                    className="text-secondary-600 hover:text-secondary-900 flex items-center transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
                <button
                    onClick={handlePrint}
                    className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 flex items-center shadow-sm transition-all hover:shadow-md"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Invoice
                </button>
            </div>

            {/* Invoice Content */}
            <div id="invoice-content" className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none rounded-lg print:rounded-none overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 print:bg-primary-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                            <p className="text-primary-100 text-lg">#{payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">{settings?.journalName || 'Global Electronic Medical & Innovation Journal'}</h2>
                            <p className="text-primary-100 text-sm mt-1">ISSN: 1234-5678</p>
                            <p className="text-primary-100 text-sm">{settings?.contactEmail || 'editor@gemij.com'}</p>
                        </div>
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="p-8">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-secondary-500 text-sm font-semibold uppercase tracking-wider mb-3">Bill To</h3>
                            <p className="font-bold text-foreground text-lg">{payment.authorName}</p>
                            <p className="text-muted-foreground">{payment.authorEmail}</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-3">
                                <span className="text-secondary-500 text-sm font-semibold uppercase tracking-wider mr-4">Date:</span>
                                <span className="text-foreground font-medium">{formatDate(payment.paymentDate || new Date().toISOString())}</span>
                            </div>
                            <div>
                                <span className="text-secondary-500 text-sm font-semibold uppercase tracking-wider mr-4">Status:</span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {payment.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="border border-border rounded-lg overflow-hidden mb-8">
                        <table className="w-full">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700 uppercase tracking-wider">Description</th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-secondary-700 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-border">
                                    <td className="py-6 px-6">
                                        <p className="font-semibold text-foreground text-lg">Article Processing Charge (APC)</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Manuscript: {payment.submissionTitle}
                                        </p>
                                    </td>
                                    <td className="text-right py-6 px-6 text-foreground font-semibold text-lg">
                                        {formatAmount(Number(payment.amount))}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-secondary-50 border-t-2 border-primary-200">
                                <tr>
                                    <td className="py-5 px-6 text-right font-bold text-foreground text-lg">Total Amount</td>
                                    <td className="py-5 px-6 text-right font-bold text-3xl text-primary-600">
                                        {formatAmount(Number(payment.amount))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Method Used - Only show the method that was used */}
                    <div className="border-t border-border pt-8 mb-8">
                        <h3 className="text-lg font-bold text-foreground mb-4">Payment Method Used</h3>
                        <div className="bg-secondary-50 border border-border rounded-lg p-6">
                            {payment.paymentMethod === 'BANK_TRANSFER' ? (
                                <div>
                                    <h4 className="font-semibold text-foreground mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        Bank Transfer
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                                            <p className="text-sm font-semibold text-foreground">{settings?.bankName || 'HDFC Bank'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                                            <p className="text-sm font-semibold text-foreground">{settings?.bankAccountName || 'GEMIJ Publications'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                                            <p className="text-sm font-semibold text-foreground">{settings?.bankAccountNumber || 'XXXXXXXXXXXX'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">IFSC Code</p>
                                            <p className="text-sm font-semibold text-foreground">{settings?.bankIfsc || 'HDFC000XXXX'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : payment.paymentMethod === 'UPI' ? (
                                <div>
                                    <h4 className="font-semibold text-foreground mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        UPI Payment
                                    </h4>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                                        <p className="text-sm font-semibold text-foreground">{settings?.upiId || 'Not available'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment method: {payment.paymentMethod || 'Not specified'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border pt-8 text-sm">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-foreground mb-3">Contact Information</h4>
                                <p className="text-muted-foreground mb-1">Email: {settings?.contactEmail || 'support@gemij.com'}</p>
                                <p className="text-muted-foreground">Web: {settings?.journalWebsite || 'www.gemij.com'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground italic">
                                    Thank you for publishing with us.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    This is a computer-generated invoice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    
                    /* Hide non-printable elements */
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Hide global navigation and footer */
                    nav, footer, header, .header, .footer {
                        display: none !important;
                    }
                    
                    /* Reset body and html */
                    body, html {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    /* Ensure invoice content is properly sized */
                    #invoice-content {
                        max-width: 100%;
                        margin: 0;
                        box-shadow: none !important;
                        page-break-after: avoid;
                    }
                    
                    /* Force background colors to print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    /* Ensure proper text rendering */
                    body {
                        font-size: 12pt;
                        line-height: 1.5;
                    }
                    
                    /* Prevent page breaks inside important elements */
                    table, .invoice-section {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
};

export default Invoice;
