import React from 'react';
import { TimelineEvent } from '@/types';
import { format } from 'date-fns';

interface TimelineProps {
    events: TimelineEvent[];
    className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
    const getEventIcon = (event: string) => {
        switch (event) {
            case 'STATUS_CHANGE':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'REVIEW_SUBMITTED':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'PAYMENT_RECEIVED':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                );
            case 'REVISION_SUBMITTED':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                );
            case 'FILE_UPLOADED':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                );
            case 'EDITOR_ASSIGNED':
            case 'REVIEWER_ASSIGNED':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getEventColor = (event: string) => {
        switch (event) {
            case 'STATUS_CHANGE':
                return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'REVIEW_SUBMITTED':
                return 'bg-purple-100 text-purple-600 border-purple-200';
            case 'PAYMENT_RECEIVED':
                return 'bg-green-100 text-green-600 border-green-200';
            case 'REVISION_SUBMITTED':
                return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'FILE_UPLOADED':
                return 'bg-indigo-100 text-indigo-600 border-indigo-200';
            case 'EDITOR_ASSIGNED':
            case 'REVIEWER_ASSIGNED':
                return 'bg-cyan-100 text-cyan-600 border-cyan-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (!events || events.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <div className="text-slate-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-slate-600">No timeline events yet</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200"></div>

            <div className="space-y-6">
                {events.map((event, index) => (
                    <div key={event.id} className="relative flex items-start gap-4 group">
                        {/* Icon */}
                        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getEventColor(event.event)} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {getEventIcon(event.event)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 group-hover:border-blue-300">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <h4 className="font-semibold text-slate-900 text-lg">{event.description}</h4>
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                    {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
                                </span>
                            </div>

                            {event.fromStatus && event.toStatus && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                                    <span className="px-2 py-1 bg-slate-100 rounded-lg font-medium">
                                        {event.fromStatus.replace(/_/g, ' ')}
                                    </span>
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                                        {event.toStatus.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            )}

                            {event.performedBy && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Performed by: {event.performedBy}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;
