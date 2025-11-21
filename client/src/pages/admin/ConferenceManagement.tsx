import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Calendar, Tag } from 'lucide-react';
import issueService, { Conference } from '../../services/issueService';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

const ConferenceManagement: React.FC = () => {
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingConference, setEditingConference] = useState<Conference | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        proceedingsNo: '',
        category: '',
        description: '',
        year: new Date().getFullYear().toString(),
        isActive: true
    });

    useEffect(() => {
        loadConferences();
    }, []);

    const loadConferences = async () => {
        try {
            setLoading(true);
            const response = await issueService.getConferences();
            setConferences(response.data || []);
        } catch (error) {
            console.error('Failed to load conferences:', error);
            setMessage({ text: 'Failed to load conferences', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (conference?: Conference) => {
        if (conference) {
            setEditingConference(conference);
            setFormData({
                name: conference.name,
                proceedingsNo: conference.proceedingsNo || '',
                category: conference.category || '',
                description: conference.description || '',
                year: conference.year.toString(),
                isActive: conference.isActive
            });
        } else {
            setEditingConference(null);
            setFormData({
                name: '',
                proceedingsNo: '',
                category: '',
                description: '',
                year: new Date().getFullYear().toString(),
                isActive: true
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                name: formData.name,
                proceedingsNo: formData.proceedingsNo || undefined,
                category: formData.category || undefined,
                description: formData.description || undefined,
                year: parseInt(formData.year),
                isActive: formData.isActive
            };

            if (editingConference) {
                await issueService.updateConference(editingConference.id, data);
                setMessage({ text: 'Conference updated successfully', type: 'success' });
            } else {
                await issueService.createConference(data);
                setMessage({ text: 'Conference created successfully', type: 'success' });
            }

            setModalOpen(false);
            loadConferences();
        } catch (error: any) {
            console.error('Failed to save conference:', error);
            setMessage({
                text: error.response?.data?.error || 'Failed to save conference',
                type: 'error'
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this conference?')) return;

        try {
            await issueService.deleteConference(id);
            setMessage({ text: 'Conference deleted successfully', type: 'success' });
            loadConferences();
        } catch (error: any) {
            console.error('Failed to delete conference:', error);
            setMessage({
                text: error.response?.data?.error || 'Failed to delete conference',
                type: 'error'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Conference Management</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Create and manage conference proceedings
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Conference
                    </button>
                </div>

                {message && (
                    <div className="mb-6">
                        <Alert variant={message.type} onClose={() => setMessage(null)}>
                            {message.text}
                        </Alert>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading conferences...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {conferences.map((conference) => (
                            <div
                                key={conference.id}
                                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${conference.isActive ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'
                                    }`}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-purple-100 p-2 rounded-lg">
                                                <Users className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {conference.year}
                                                </h3>
                                                {conference.proceedingsNo && (
                                                    <div className="text-sm text-gray-500">
                                                        Proceedings #{conference.proceedingsNo}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {conference.isActive && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-900 font-medium mb-2">{conference.name}</p>

                                    {conference.category && (
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Tag className="h-4 w-4 mr-2" />
                                            <span>{conference.category}</span>
                                        </div>
                                    )}

                                    {conference.description && (
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                            {conference.description}
                                        </p>
                                    )}

                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>
                                            Created {new Date(conference.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(conference)}
                                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                                title="Edit Conference"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(conference.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete Conference"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={editingConference ? 'Edit Conference' : 'Create New Conference'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Conference Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., International Conference on AI"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Year *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1900"
                                    max="2100"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proceedings No.
                                </label>
                                <input
                                    type="text"
                                    value={formData.proceedingsNo}
                                    onChange={(e) => setFormData({ ...formData, proceedingsNo: e.target.value })}
                                    placeholder="e.g., 2024-01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g., Computer Science, Engineering"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Brief description of the conference"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Active Conference
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                            >
                                {editingConference ? 'Update Conference' : 'Create Conference'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default ConferenceManagement;
