import React from 'react';

const PeerReview: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Peer Review Process
        </h1>
        <p className="text-lg text-secondary-600">
          Understanding our rigorous peer review system
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Review Process Overview
          </h2>
          <div className="card">
            <div className="card-body">
              <p className="text-secondary-700 leading-relaxed mb-4">
                IJATEM employs a rigorous double-blind peer review process to ensure the quality 
                and integrity of published research. Our review system is designed to be fair, 
                transparent, and constructive, helping authors improve their work while maintaining 
                high publication standards.
              </p>
              <p className="text-secondary-700 leading-relaxed">
                The entire process typically takes 6-8 weeks from submission to initial decision, 
                though this may vary depending on reviewer availability and the complexity of the manuscript.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Review Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 mb-2">
                  Initial Submission (Day 0)
                </h3>
                <p className="text-secondary-700">
                  Manuscript submitted through online system. Automatic acknowledgment sent to authors.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 mb-2">
                  Editorial Screening (Days 1-7)
                </h3>
                <p className="text-secondary-700">
                  Editor-in-Chief conducts initial screening for scope, quality, and formatting compliance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 mb-2">
                  Reviewer Assignment (Days 8-14)
                </h3>
                <p className="text-secondary-700">
                  Associate editors identify and invite qualified reviewers based on expertise and availability.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 mb-2">
                  Peer Review (Days 15-42)
                </h3>
                <p className="text-secondary-700">
                  Reviewers conduct thorough evaluation and provide detailed feedback and recommendations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 mb-2">
                  Editorial Decision (Days 43-49)
                </h3>
                <p className="text-secondary-700">
                  Editor synthesizes reviewer feedback and makes final decision with detailed comments.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Review Criteria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Technical Quality
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• Methodological rigor and validity</li>
                  <li>• Appropriate use of statistical methods</li>
                  <li>• Reproducibility of results</li>
                  <li>• Data quality and analysis</li>
                  <li>• Technical accuracy</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Novelty & Significance
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• Originality of contribution</li>
                  <li>• Advancement of knowledge</li>
                  <li>• Practical or theoretical impact</li>
                  <li>• Relevance to field</li>
                  <li>• Innovation in approach</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Presentation Quality
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• Clarity of writing and organization</li>
                  <li>• Appropriate use of figures and tables</li>
                  <li>• Comprehensive literature review</li>
                  <li>• Logical flow of arguments</li>
                  <li>• Grammar and language quality</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Ethical Standards
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• Research ethics compliance</li>
                  <li>• Proper attribution and citations</li>
                  <li>• Conflict of interest disclosure</li>
                  <li>• Data sharing and availability</li>
                  <li>• Responsible conduct of research</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Decision Categories
          </h2>
          <div className="space-y-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center mb-3">
                  <span className="status-badge status-accepted mr-3">Accept</span>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Accept without Revision
                  </h3>
                </div>
                <p className="text-secondary-700">
                  Manuscript meets all publication standards and requires no changes. 
                  Proceeds directly to production phase.
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center mb-3">
                  <span className="status-badge bg-green-100 text-green-800 mr-3">Minor Revision</span>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Accept with Minor Revisions
                  </h3>
                </div>
                <p className="text-secondary-700">
                  Manuscript is acceptable but requires minor changes such as clarifications, 
                  additional references, or minor methodological improvements.
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center mb-3">
                  <span className="status-badge bg-yellow-100 text-yellow-800 mr-3">Major Revision</span>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Major Revisions Required
                  </h3>
                </div>
                <p className="text-secondary-700">
                  Manuscript has potential but requires significant improvements in methodology, 
                  analysis, or presentation. May require additional experiments or data.
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center mb-3">
                  <span className="status-badge status-rejected mr-3">Reject</span>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Reject
                  </h3>
                </div>
                <p className="text-secondary-700">
                  Manuscript does not meet publication standards due to fundamental flaws, 
                  insufficient novelty, or scope mismatch. Authors may submit to other venues.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            For Reviewers
          </h2>
          <div className="space-y-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Reviewer Responsibilities
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• Provide timely, constructive, and detailed feedback</li>
                  <li>• Maintain confidentiality of the review process</li>
                  <li>• Declare any conflicts of interest</li>
                  <li>• Assess manuscripts objectively and fairly</li>
                  <li>• Suggest improvements and additional references</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Review Guidelines
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-1">Confidential Comments to Editor</h4>
                    <p className="text-secondary-700 text-sm">
                      Private assessment of manuscript quality, recommendation, and any concerns 
                      about ethics or methodology.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-1">Comments to Authors</h4>
                    <p className="text-secondary-700 text-sm">
                      Constructive feedback focusing on specific improvements, clarifications, 
                      and suggestions for strengthening the work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Become a Reviewer
                </h3>
                <p className="text-secondary-700 mb-4">
                  We are always seeking qualified experts to join our reviewer pool. 
                  Reviewers play a crucial role in maintaining the quality of scientific literature.
                </p>
                <div className="space-y-2">
                  <p className="text-secondary-700">
                    <strong>Requirements:</strong> PhD or equivalent, active research experience, 
                    publication record in relevant field
                  </p>
                  <p className="text-secondary-700">
                    <strong>Time Commitment:</strong> 2-4 reviews per year, 2-3 weeks per review
                  </p>
                  <p className="text-secondary-700">
                    <strong>Benefits:</strong> Recognition certificate, reviewer credits, 
                    early access to cutting-edge research
                  </p>
                </div>
                <div className="mt-4">
                  <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                    Apply to be a Reviewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Appeals Process
          </h2>
          <div className="card">
            <div className="card-body">
              <p className="text-secondary-700 mb-4">
                Authors who believe their manuscript was unfairly rejected may submit an appeal 
                within 30 days of the decision. Appeals should include:
              </p>
              <ul className="text-secondary-700 space-y-2 mb-4">
                <li>• Detailed explanation of concerns with the review process</li>
                <li>• Point-by-point response to reviewer comments</li>
                <li>• Additional evidence supporting the manuscript's merit</li>
                <li>• Request for specific action (re-review, different reviewers, etc.)</li>
              </ul>
              <p className="text-secondary-700">
                Appeals are reviewed by the Editor-in-Chief and may result in a second review 
                by different reviewers or confirmation of the original decision.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Contact Information
          </h2>
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Editorial Inquiries</h3>
                  <p className="text-secondary-700">
                    Questions about the review process<br />
                    or editorial decisions:<br />
                    <strong>editor@ijatem.com</strong>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Reviewer Applications</h3>
                  <p className="text-secondary-700">
                    Applications to join our<br />
                    reviewer panel:<br />
                    <strong>reviewers@ijatem.com</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PeerReview;