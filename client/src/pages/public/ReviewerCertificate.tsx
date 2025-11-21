import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';

const ReviewerCertificate: React.FC = () => {
    const { reviewId } = useParams<{ reviewId: string }>();
    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                if (!reviewId) return;
                const data = await reviewService.getReview(reviewId);
                setReview(data);
            } catch (err) {
                console.error('Error fetching review:', err);
                setError('Failed to load certificate details.');
            } finally {
                setLoading(false);
            }
        };

        fetchReview();
    }, [reviewId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 text-red-600">
                {error || 'Certificate not found'}
            </div>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Helper to get reviewer name safely
    // Assuming review object has reviewer details populated, otherwise we might need to fetch user details
    // Based on reviewController.ts getReview, it includes reviewer: { firstName, lastName, ... }
    const reviewerName = review.reviewer
        ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
        : 'Reviewer';

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
            {/* Print Button */}
            <div className="max-w-[297mm] mx-auto mb-6 print:hidden flex justify-end">
                <button
                    onClick={() => window.print()}
                    className="bg-primary-900 text-white px-6 py-2 rounded-lg hover:bg-primary-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Certificate
                </button>
            </div>

            {/* Certificate Container - Landscape A4 aspect ratio */}
            <div className="max-w-[297mm] mx-auto bg-white shadow-xl p-12 text-center relative overflow-hidden print:shadow-none print:w-full print:max-w-none print:h-screen print:flex print:flex-col print:justify-center">

                {/* Decorative Border */}
                <div className="absolute inset-4 border-4 border-double border-primary-900 pointer-events-none"></div>
                <div className="absolute inset-6 border border-primary-100 pointer-events-none"></div>

                {/* Header */}
                <div className="mb-12 relative z-10">
                    <div className="w-24 h-24 bg-primary-900 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl font-serif font-bold">
                        G
                    </div>
                    <h1 className="text-5xl font-serif text-primary-900 mb-4 tracking-wide">CERTIFICATE</h1>
                    <h2 className="text-2xl text-primary-700 uppercase tracking-widest font-light">Of Peer Review</h2>
                </div>

                {/* Body */}
                <div className="max-w-3xl mx-auto mb-16 relative z-10">
                    <p className="text-lg text-gray-600 mb-8 italic font-serif">This is to certify that</p>

                    <div className="text-4xl font-bold text-gray-900 mb-8 font-serif border-b-2 border-gray-100 inline-block pb-2 px-8">
                        Dr. {reviewerName}
                    </div>

                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                        has successfully completed the peer review of the manuscript titled
                    </p>

                    <div className="text-xl font-semibold text-primary-800 mb-8 px-12 italic">
                        "{review.submission.title}"
                    </div>

                    <p className="text-lg text-gray-600">
                        for the <span className="font-bold text-primary-900">Global Engineering & Management International Journal</span>
                    </p>
                    <p className="text-gray-500 mt-2">
                        ISSN: 2582-5003
                    </p>
                </div>

                {/* Footer / Signatures */}
                <div className="grid grid-cols-2 gap-24 max-w-4xl mx-auto mt-12 relative z-10">
                    <div className="text-center">
                        <div className="h-16 flex items-end justify-center mb-2">
                            <div className="font-signature text-3xl text-primary-800">Editor In Chief</div>
                        </div>
                        <div className="border-t border-gray-300 pt-2">
                            <p className="font-bold text-gray-900">Editor-in-Chief</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">GEMIJ</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="h-16 flex items-end justify-center mb-2">
                            <div className="text-lg text-gray-900">{formatDate(review.submittedAt || new Date().toISOString())}</div>
                        </div>
                        <div className="border-t border-gray-300 pt-2">
                            <p className="font-bold text-gray-900">Date</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Certificate ID: {review.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <div className="text-[400px] font-serif font-bold text-primary-900 transform -rotate-12 select-none">
                        GEMIJ
                    </div>
                </div>
            </div>

            <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide global header and footer */
          nav, footer, header, .header, .footer {
            display: none !important;
          }
          /* Reset main container margins/padding */
          #main-content, main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
        .font-signature {
          font-family: 'Dancing Script', cursive; /* Ensure this font is loaded or use a fallback */
        }
      `}</style>
        </div>
    );
};

export default ReviewerCertificate;
