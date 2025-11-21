import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '@/services/adminService';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const PaymentSettings: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [settings, setSettings] = useState({
        bankAccountName: '',
        bankAccountNumber: '',
        bankName: '',
        bankIfsc: '',
        upiId: '',
        currency: 'INR',
        apcFee: '299.00',
        enableBankTransfer: true,
        enableUpi: true
    });

    const [qrFile, setQrFile] = useState<File | null>(null);
    const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await adminService.getSystemSettings();
            setSettings({
                bankAccountName: data.bankAccountName || '',
                bankAccountNumber: data.bankAccountNumber || '',
                bankName: data.bankName || '',
                bankIfsc: data.bankIfsc || '',
                upiId: data.upiId || '',
                currency: data.currency || 'INR',
                apcFee: data.apcFee?.toString() || '299.00',
                enableBankTransfer: data.enableBankTransfer !== false,
                enableUpi: data.enableUpi !== false
            });
            if (data.payment_qr_code_url) {
                setCurrentQrUrl(data.payment_qr_code_url);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            setMessage({ text: 'Failed to load settings', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setQrFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Update text settings
            await adminService.updateSystemSettings({
                ...settings,
                apcFee: parseFloat(settings.apcFee)
            });

            // Upload QR code if selected
            if (qrFile) {
                const { url } = await adminService.uploadPaymentQrCode(qrFile);
                setCurrentQrUrl(url);
                setQrFile(null);
            }

            setMessage({ text: 'Payment settings updated successfully', type: 'success' });
        } catch (error) {
            console.error('Failed to update settings:', error);
            setMessage({ text: 'Failed to update settings', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50">
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

                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                        Payment Settings
                    </h1>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        Configure bank details, UPI, and QR code for invoices.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        APC Fee Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="apcFee"
                                        value={settings.apcFee}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Currency
                                    </label>
                                    <input
                                        type="text"
                                        name="currency"
                                        value={settings.currency}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <hr className="border-secondary-200" />
                            <h3 className="text-lg font-medium text-secondary-900">Payment Methods</h3>
                            <p className="text-sm text-muted-foreground -mt-2">Choose which payment methods to display to authors</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                                    <input
                                        type="checkbox"
                                        id="enableBankTransfer"
                                        name="enableBankTransfer"
                                        checked={settings.enableBankTransfer}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="enableBankTransfer" className="text-sm font-medium text-secondary-900 cursor-pointer">
                                        Enable Bank Transfer
                                    </label>
                                </div>
                                <div className="flex items-center space-x-3 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                                    <input
                                        type="checkbox"
                                        id="enableUpi"
                                        name="enableUpi"
                                        checked={settings.enableUpi}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="enableUpi" className="text-sm font-medium text-secondary-900 cursor-pointer">
                                        Enable UPI Payment
                                    </label>
                                </div>
                            </div>

                            <hr className="border-secondary-200" />
                            <h3 className="text-lg font-medium text-secondary-900">Bank Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Account Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        name="bankAccountName"
                                        value={settings.bankAccountName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        name="bankAccountNumber"
                                        value={settings.bankAccountNumber}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={settings.bankName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        IFSC Code
                                    </label>
                                    <input
                                        type="text"
                                        name="bankIfsc"
                                        value={settings.bankIfsc}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <hr className="border-secondary-200" />
                            <h3 className="text-lg font-medium text-secondary-900">UPI & QR Code</h3>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    name="upiId"
                                    value={settings.upiId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="e.g. username@upi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    QR Code Image
                                </label>
                                <div className="flex items-center space-x-4">
                                    {currentQrUrl && (
                                        <div className="w-24 h-24 border border-secondary-200 rounded-lg overflow-hidden bg-secondary-50">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/${currentQrUrl}`}
                                                alt="Current QR"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-secondary-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-secondary-500">
                                    Upload a square image of your UPI QR code.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    loading={loading}
                                >
                                    Save Settings
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSettings;
