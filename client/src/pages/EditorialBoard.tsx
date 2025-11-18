import React from 'react';

interface BoardMember {
  name: string;
  title: string;
  affiliation: string;
  expertise: string[];
  email?: string;
  image?: string;
}

const EditorialBoard: React.FC = () => {
  const editorInChief: BoardMember = {
    name: 'Prof. Dr. Michael Anderson',
    title: 'Editor-in-Chief',
    affiliation: 'Department of Computer Science, Stanford University, USA',
    expertise: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
    email: 'editor@ijatem.com'
  };

  const associateEditors: BoardMember[] = [
    {
      name: 'Prof. Dr. Sarah Chen',
      title: 'Associate Editor',
      affiliation: 'School of Engineering, MIT, USA',
      expertise: ['Robotics', 'Automation', 'Control Systems']
    },
    {
      name: 'Prof. Dr. Ahmed Hassan',
      title: 'Associate Editor',
      affiliation: 'Department of Information Systems, University of Oxford, UK',
      expertise: ['Cybersecurity', 'Information Systems', 'Blockchain']
    },
    {
      name: 'Prof. Dr. Maria Rodriguez',
      title: 'Associate Editor',
      affiliation: 'Institute of Technology Management, ETH Zurich, Switzerland',
      expertise: ['Technology Management', 'Innovation', 'Digital Transformation']
    }
  ];

  const editorialBoard: BoardMember[] = [
    {
      name: 'Prof. Dr. James Wilson',
      title: 'Editorial Board Member',
      affiliation: 'Carnegie Mellon University, USA',
      expertise: ['Software Engineering', 'Human-Computer Interaction']
    },
    {
      name: 'Prof. Dr. Li Wei',
      title: 'Editorial Board Member',
      affiliation: 'Tsinghua University, China',
      expertise: ['Internet of Things', 'Smart Systems', 'Edge Computing']
    },
    {
      name: 'Prof. Dr. Elena Petrov',
      title: 'Editorial Board Member',
      affiliation: 'Moscow Institute of Technology, Russia',
      expertise: ['Quantum Computing', 'Cryptography', 'Information Theory']
    },
    {
      name: 'Prof. Dr. David Thompson',
      title: 'Editorial Board Member',
      affiliation: 'University of Cambridge, UK',
      expertise: ['Data Analytics', 'Business Intelligence', 'Decision Support Systems']
    },
    {
      name: 'Prof. Dr. Priya Sharma',
      title: 'Editorial Board Member',
      affiliation: 'Indian Institute of Technology Delhi, India',
      expertise: ['Cloud Computing', 'Distributed Systems', 'Performance Engineering']
    },
    {
      name: 'Prof. Dr. Robert Kim',
      title: 'Editorial Board Member',
      affiliation: 'Seoul National University, South Korea',
      expertise: ['Mobile Computing', 'Wireless Networks', '5G/6G Technologies']
    },
    {
      name: 'Prof. Dr. Anna Mueller',
      title: 'Editorial Board Member',
      affiliation: 'Technical University of Munich, Germany',
      expertise: ['Computer Vision', 'Image Processing', 'Pattern Recognition']
    },
    {
      name: 'Prof. Dr. Carlos Silva',
      title: 'Editorial Board Member',
      affiliation: 'University of São Paulo, Brazil',
      expertise: ['Operations Research', 'Supply Chain Management', 'Optimization']
    },
    {
      name: 'Prof. Dr. Jennifer Adams',
      title: 'Editorial Board Member',
      affiliation: 'University of Toronto, Canada',
      expertise: ['Natural Language Processing', 'Computational Linguistics', 'AI Ethics']
    },
    {
      name: 'Prof. Dr. Hiroshi Tanaka',
      title: 'Editorial Board Member',
      affiliation: 'University of Tokyo, Japan',
      expertise: ['Embedded Systems', 'Real-time Computing', 'Automotive Technology']
    }
  ];

  const renderBoardMember = (member: BoardMember, isChief: boolean = false) => (
    <div key={member.name} className={`card ${isChief ? 'border-primary-200 bg-primary-50' : ''}`}>
      <div className="card-body">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-secondary-200 rounded-full flex items-center justify-center">
              <span className="text-secondary-600 font-medium text-lg">
                {member.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-1 ${isChief ? 'text-primary-900' : 'text-secondary-900'}`}>
              {member.name}
            </h3>
            <p className={`font-medium mb-2 ${isChief ? 'text-primary-700' : 'text-secondary-700'}`}>
              {member.title}
            </p>
            <p className="text-secondary-600 text-sm mb-3">
              {member.affiliation}
            </p>
            
            <div className="mb-3">
              <h4 className="text-sm font-medium text-secondary-900 mb-2">Areas of Expertise:</h4>
              <div className="flex flex-wrap gap-2">
                {member.expertise.map((area, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isChief 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-secondary-100 text-secondary-800'
                    }`}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
            
            {member.email && (
              <p className="text-sm text-secondary-600">
                <strong>Contact:</strong> {member.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Editorial Board
        </h1>
        <p className="text-lg text-secondary-600">
          Meet our distinguished editorial team committed to advancing research in technology, engineering, and management
        </p>
      </div>

      {/* Editor-in-Chief */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
          Editor-in-Chief
        </h2>
        {renderBoardMember(editorInChief, true)}
      </section>

      {/* Associate Editors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
          Associate Editors
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {associateEditors.map(editor => renderBoardMember(editor))}
        </div>
      </section>

      {/* Editorial Board Members */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
          Editorial Board Members
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {editorialBoard.map(member => renderBoardMember(member))}
        </div>
      </section>

      {/* Board Statistics */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
          Board Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {1 + associateEditors.length + editorialBoard.length}
              </div>
              <div className="text-secondary-600">Total Members</div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {new Set([
                  ...editorInChief.affiliation.split(',').pop()?.trim(),
                  ...associateEditors.map(e => e.affiliation.split(',').pop()?.trim()),
                  ...editorialBoard.map(e => e.affiliation.split(',').pop()?.trim())
                ].filter(Boolean)).size}
              </div>
              <div className="text-secondary-600">Countries</div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {new Set([
                  ...editorInChief.expertise,
                  ...associateEditors.flatMap(e => e.expertise),
                  ...editorialBoard.flatMap(e => e.expertise)
                ]).size}
              </div>
              <div className="text-secondary-600">Expertise Areas</div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {associateEditors.length}
              </div>
              <div className="text-secondary-600">Associate Editors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Responsibilities */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
          Editorial Responsibilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Editor-in-Chief
              </h3>
              <ul className="text-secondary-700 space-y-2">
                <li>• Overall journal strategy and vision</li>
                <li>• Final editorial decisions</li>
                <li>• Quality assurance and standards</li>
                <li>• Editorial policy development</li>
                <li>• Stakeholder relationships</li>
              </ul>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Associate Editors
              </h3>
              <ul className="text-secondary-700 space-y-2">
                <li>• Manuscript handling and review</li>
                <li>• Reviewer recruitment and management</li>
                <li>• Editorial recommendations</li>
                <li>• Special issue coordination</li>
                <li>• Author communication</li>
              </ul>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Board Members
              </h3>
              <ul className="text-secondary-700 space-y-2">
                <li>• Peer review activities</li>
                <li>• Editorial advice and guidance</li>
                <li>• Journal promotion and outreach</li>
                <li>• Research trend identification</li>
                <li>• Community engagement</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Board */}
      <section>
        <div className="card bg-primary-50 border-primary-200">
          <div className="card-body text-center">
            <h2 className="text-2xl font-semibold text-primary-900 mb-4">
              Join Our Editorial Board
            </h2>
            <p className="text-primary-700 mb-6 max-w-2xl mx-auto">
              We are always looking for distinguished researchers and practitioners to join our editorial board. 
              Board members play a crucial role in maintaining the quality and reputation of our journal.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-primary-900 mb-2">Requirements</h3>
                <ul className="text-primary-700 text-sm space-y-1">
                  <li>• PhD or equivalent in relevant field</li>
                  <li>• Strong publication record</li>
                  <li>• Active research involvement</li>
                  <li>• Editorial or review experience</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-primary-900 mb-2">Benefits</h3>
                <ul className="text-primary-700 text-sm space-y-1">
                  <li>• Professional recognition</li>
                  <li>• Networking opportunities</li>
                  <li>• Contribution to scientific community</li>
                  <li>• Editorial board certificate</li>
                </ul>
              </div>
            </div>
            
            <button className="bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 transition-colors">
              Apply to Join Board
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EditorialBoard;