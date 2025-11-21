import React from 'react';
import { SubmissionStatus } from '@/types';

interface TimelineEvent {
  id: string;
  event: string;
  fromStatus?: string;
  toStatus?: string;
  description: string;
  performedBy?: string;
  createdAt: string;
}

interface SubmissionTimelineProps {
  status: SubmissionStatus;
  timeline?: TimelineEvent[];
  submittedAt?: string;
  acceptedAt?: string;
  publishedAt?: string;
}

const SubmissionTimeline: React.FC<SubmissionTimelineProps> = ({
  status,
  timeline = [],
  submittedAt,
  acceptedAt,
  publishedAt
}) => {
  const getStatusColor = (currentStatus: SubmissionStatus) => {
    switch (currentStatus) {
      case SubmissionStatus.DRAFT:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case SubmissionStatus.SUBMITTED:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case SubmissionStatus.RETURNED_FOR_FORMATTING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case SubmissionStatus.UNDER_REVIEW:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case SubmissionStatus.REVISION_REQUIRED:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case SubmissionStatus.ACCEPTED:
        return 'bg-green-100 text-green-800 border-green-300';
      case SubmissionStatus.PAYMENT_PENDING:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case SubmissionStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-300';
      case SubmissionStatus.PUBLISHED:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (currentStatus: SubmissionStatus) => {
    switch (currentStatus) {
      case SubmissionStatus.DRAFT:
        return '📝';
      case SubmissionStatus.SUBMITTED:
        return '📤';
      case SubmissionStatus.RETURNED_FOR_FORMATTING:
        return '🔄';
      case SubmissionStatus.UNDER_REVIEW:
        return '👥';
      case SubmissionStatus.REVISION_REQUIRED:
        return '✏️';
      case SubmissionStatus.ACCEPTED:
        return '✅';
      case SubmissionStatus.PAYMENT_PENDING:
        return '💳';
      case SubmissionStatus.REJECTED:
        return '❌';
      case SubmissionStatus.PUBLISHED:
        return '🎉';
      default:
        return '📄';
    }
  };

  const formatStatus = (status: SubmissionStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Submission Status</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
          <span className="mr-2">{getStatusIcon(status)}</span>
          {formatStatus(status)}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { status: SubmissionStatus.SUBMITTED, label: 'Submitted', date: submittedAt },
            { status: SubmissionStatus.UNDER_REVIEW, label: 'Under Review', date: null },
            { status: SubmissionStatus.ACCEPTED, label: 'Accepted', date: acceptedAt },
            { status: SubmissionStatus.PUBLISHED, label: 'Published', date: publishedAt }
          ].map((step, index) => {
            const isCompleted = getStatusOrder(status) >= getStatusOrder(step.status);
            const isCurrent = status === step.status;
            
            return (
              <div key={step.status} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{step.label}</div>
                  {step.date && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(step.date)}
                    </div>
                  )}
                </div>
                {index < 3 && (
                  <div className={`absolute h-0.5 w-24 mt-4 ${
                    getStatusOrder(status) > getStatusOrder(step.status) 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  }`} style={{ left: '50%', transform: 'translateX(-50%)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Events */}
      {timeline.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Timeline</h4>
          <div className="space-y-4">
            {timeline.map((event) => (
              <div key={event.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {event.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(event.createdAt)}
                    {event.performedBy && ` • by ${event.performedBy}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusOrder = (status: SubmissionStatus): number => {
  const order = {
    [SubmissionStatus.DRAFT]: 0,
    [SubmissionStatus.SUBMITTED]: 1,
    [SubmissionStatus.RETURNED_FOR_FORMATTING]: 1,
    [SubmissionStatus.UNDER_REVIEW]: 2,
    [SubmissionStatus.REVISION_REQUIRED]: 2,
    [SubmissionStatus.ACCEPTED]: 3,
    [SubmissionStatus.PAYMENT_PENDING]: 3,
    [SubmissionStatus.PUBLISHED]: 4,
    [SubmissionStatus.REJECTED]: -1,
    [SubmissionStatus.WITHDRAWN]: -1
  };
  return order[status] || 0;
};

export default SubmissionTimeline;