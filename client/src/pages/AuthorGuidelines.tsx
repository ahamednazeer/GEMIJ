import React from 'react';

const AuthorGuidelines: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Author Guidelines
        </h1>
        <p className="text-lg text-secondary-600">
          Guidelines for manuscript preparation and submission
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Manuscript Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Research Articles
                </h3>
                <p className="text-secondary-700 mb-3">
                  Original research contributions with significant findings.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>• Length: 6,000-8,000 words</li>
                  <li>• Abstract: 250-300 words</li>
                  <li>• Keywords: 4-6 terms</li>
                  <li>• References: 30-50</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Review Articles
                </h3>
                <p className="text-secondary-700 mb-3">
                  Comprehensive reviews of current research topics.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>• Length: 8,000-12,000 words</li>
                  <li>• Abstract: 300-400 words</li>
                  <li>• Keywords: 5-8 terms</li>
                  <li>• References: 80-150</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Case Studies
                </h3>
                <p className="text-secondary-700 mb-3">
                  Detailed analysis of specific implementations or applications.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>• Length: 4,000-6,000 words</li>
                  <li>• Abstract: 200-250 words</li>
                  <li>• Keywords: 4-6 terms</li>
                  <li>• References: 20-40</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Technical Notes
                </h3>
                <p className="text-secondary-700 mb-3">
                  Brief communications on technical innovations or methods.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>• Length: 2,000-4,000 words</li>
                  <li>• Abstract: 150-200 words</li>
                  <li>• Keywords: 3-5 terms</li>
                  <li>• References: 10-25</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Manuscript Structure
          </h2>
          <div className="card">
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">1. Title Page</h3>
                  <ul className="text-secondary-700 space-y-1 ml-4">
                    <li>• Concise and informative title</li>
                    <li>• Full names and affiliations of all authors</li>
                    <li>• Corresponding author contact information</li>
                    <li>• ORCID IDs (recommended)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">2. Abstract</h3>
                  <ul className="text-secondary-700 space-y-1 ml-4">
                    <li>• Structured abstract with Background, Methods, Results, Conclusions</li>
                    <li>• No references or abbreviations</li>
                    <li>• Clear and concise summary of the work</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">3. Keywords</h3>
                  <ul className="text-secondary-700 space-y-1 ml-4">
                    <li>• 4-6 keywords or phrases</li>
                    <li>• Use terms from established vocabularies when possible</li>
                    <li>• Avoid words already in the title</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">4. Main Text</h3>
                  <ul className="text-secondary-700 space-y-1 ml-4">
                    <li>• Introduction</li>
                    <li>• Literature Review (if applicable)</li>
                    <li>• Methodology</li>
                    <li>• Results and Discussion</li>
                    <li>• Conclusions</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">5. Additional Sections</h3>
                  <ul className="text-secondary-700 space-y-1 ml-4">
                    <li>• Acknowledgments</li>
                    <li>• Funding information</li>
                    <li>• Conflict of interest statement</li>
                    <li>• Data availability statement</li>
                    <li>• References</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Formatting Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Document Format
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• File format: Microsoft Word (.docx) or PDF</li>
                  <li>• Font: Times New Roman, 12pt</li>
                  <li>• Line spacing: Double</li>
                  <li>• Margins: 1 inch on all sides</li>
                  <li>• Page numbers: Bottom center</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Figures and Tables
                </h3>
                <ul className="text-secondary-700 space-y-2">
                  <li>• High resolution (300 DPI minimum)</li>
                  <li>• Clear, readable labels and captions</li>
                  <li>• Numbered consecutively</li>
                  <li>• Referenced in the text</li>
                  <li>• Separate files for each figure</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Reference Style
          </h2>
          <div className="card">
            <div className="card-body">
              <p className="text-secondary-700 mb-4">
                IJATEM follows the IEEE reference style. All references should be numbered consecutively 
                in the order they appear in the text.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Journal Articles</h3>
                  <div className="bg-secondary-50 p-3 rounded text-sm font-mono text-secondary-700">
                    [1] A. Author, "Title of paper," Journal Name, vol. X, no. Y, pp. XX-YY, Month Year.
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Conference Papers</h3>
                  <div className="bg-secondary-50 p-3 rounded text-sm font-mono text-secondary-700">
                    [2] B. Author, "Title of paper," in Proc. Conference Name, City, Country, Year, pp. XX-YY.
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Books</h3>
                  <div className="bg-secondary-50 p-3 rounded text-sm font-mono text-secondary-700">
                    [3] C. Author, Book Title. City: Publisher, Year.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Submission Process
          </h2>
          <div className="space-y-4">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Step 1: Prepare Your Manuscript
                </h3>
                <ul className="text-secondary-700 space-y-1">
                  <li>• Ensure compliance with all formatting guidelines</li>
                  <li>• Complete plagiarism check</li>
                  <li>• Obtain necessary permissions for copyrighted material</li>
                  <li>• Prepare cover letter</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Step 2: Online Submission
                </h3>
                <ul className="text-secondary-700 space-y-1">
                  <li>• Create account on submission system</li>
                  <li>• Upload manuscript and supplementary files</li>
                  <li>• Complete author information forms</li>
                  <li>• Submit for editorial review</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Step 3: Review Process
                </h3>
                <ul className="text-secondary-700 space-y-1">
                  <li>• Initial editorial screening (1-2 weeks)</li>
                  <li>• Peer review by experts (4-6 weeks)</li>
                  <li>• Author revision (if required)</li>
                  <li>• Final editorial decision</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Publication Ethics
          </h2>
          <div className="card">
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Originality</h3>
                  <p className="text-secondary-700">
                    All submissions must be original work that has not been published elsewhere 
                    or is under consideration for publication in another journal.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Authorship</h3>
                  <p className="text-secondary-700">
                    All listed authors must have made significant contributions to the work and 
                    agree to the submission. Changes to authorship after submission require 
                    written consent from all authors.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Conflicts of Interest</h3>
                  <p className="text-secondary-700">
                    Authors must declare any financial or personal relationships that could 
                    influence the work. This includes funding sources, employment, and 
                    personal relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Contact for Questions
          </h2>
          <div className="card">
            <div className="card-body">
              <p className="text-secondary-700 mb-4">
                If you have questions about the submission process or guidelines, please contact:
              </p>
              <div className="space-y-2">
                <p className="text-secondary-700">
                  <strong>Editorial Office:</strong> editor@ijatem.com
                </p>
                <p className="text-secondary-700">
                  <strong>Technical Support:</strong> support@ijatem.com
                </p>
                <p className="text-secondary-700">
                  <strong>Response Time:</strong> 24-48 hours
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthorGuidelines;