import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          About IJATEM
        </h1>
        <p className="text-lg text-secondary-600">
          International Journal of Advanced Technology, Engineering and Management
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Journal Overview
          </h2>
          <div className="prose prose-secondary max-w-none">
            <p className="text-secondary-700 leading-relaxed mb-4">
              The International Journal of Advanced Technology, Engineering and Management (IJATEM) is a peer-reviewed, 
              open-access journal that publishes high-quality research articles, reviews, and technical notes in the 
              fields of advanced technology, engineering, and management sciences.
            </p>
            <p className="text-secondary-700 leading-relaxed mb-4">
              Our mission is to provide a platform for researchers, academics, and industry professionals to share 
              their innovative work and contribute to the advancement of knowledge in these rapidly evolving fields.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Scope and Coverage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Technology & Engineering
                </h3>
                <ul className="space-y-2 text-secondary-700">
                  <li>• Artificial Intelligence & Machine Learning</li>
                  <li>• Computer Science & Software Engineering</li>
                  <li>• Data Science & Big Data Analytics</li>
                  <li>• Cybersecurity & Information Systems</li>
                  <li>• Internet of Things (IoT)</li>
                  <li>• Robotics & Automation</li>
                </ul>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Management & Innovation
                </h3>
                <ul className="space-y-2 text-secondary-700">
                  <li>• Technology Management</li>
                  <li>• Innovation & Entrepreneurship</li>
                  <li>• Digital Transformation</li>
                  <li>• Project Management</li>
                  <li>• Strategic Management</li>
                  <li>• Operations Research</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Publication Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Publication Frequency</h3>
                <p className="text-secondary-700">Quarterly (4 issues per year)</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">ISSN</h3>
                <p className="text-secondary-700">2456-1234 (Online)</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Publisher</h3>
                <p className="text-secondary-700">IJATEM Publications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Language</h3>
                <p className="text-secondary-700">English</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Access Type</h3>
                <p className="text-secondary-700">Open Access</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Peer Review</h3>
                <p className="text-secondary-700">Double-blind peer review</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Editorial Policies
          </h2>
          <div className="space-y-4">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Open Access Policy
                </h3>
                <p className="text-secondary-700">
                  IJATEM is committed to providing immediate open access to all published content. 
                  All articles are freely available to readers worldwide without subscription fees or barriers.
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Peer Review Process
                </h3>
                <p className="text-secondary-700">
                  All submissions undergo rigorous double-blind peer review by experts in the relevant field. 
                  The review process typically takes 4-6 weeks from submission to initial decision.
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  Ethical Standards
                </h3>
                <p className="text-secondary-700">
                  We adhere to the highest ethical standards in publishing and follow the guidelines of the 
                  Committee on Publication Ethics (COPE). All submissions are checked for plagiarism and originality.
                </p>
              </div>
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
                  <h3 className="font-semibold text-secondary-900 mb-2">Editorial Office</h3>
                  <p className="text-secondary-700">
                    IJATEM Editorial Office<br />
                    123 Academic Street<br />
                    Research City, RC 12345<br />
                    Email: editor@ijatem.com<br />
                    Phone: +1 (555) 123-4567
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">Technical Support</h3>
                  <p className="text-secondary-700">
                    For technical issues with submissions<br />
                    or website problems:<br />
                    Email: support@ijatem.com<br />
                    Response time: 24-48 hours
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

export default About;