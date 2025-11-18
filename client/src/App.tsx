import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import SubmitPaper from '@/pages/author/SubmitPaper';
import SubmissionDetails from '@/pages/author/SubmissionDetails';
import SubmitRevision from '@/pages/author/SubmitRevision';
import PaymentPage from '@/pages/author/PaymentPage';
import ProofReview from '@/pages/author/ProofReview';
import SubmissionScreening from '@/pages/editor/SubmissionScreening';
import ReviewerAssignment from '@/pages/editor/ReviewerAssignment';
import ReviewTracking from '@/pages/editor/ReviewTracking';
import EditorialDecision from '@/pages/editor/EditorialDecision';
import RevisionHandling from '@/pages/editor/RevisionHandling';
import ProductionWorkflow from '@/pages/editor/ProductionWorkflow';
import EditorNotifications from '@/pages/editor/EditorNotifications';
import ReviewInvitation from '@/pages/reviewer/ReviewInvitation';
import ReviewForm from '@/pages/reviewer/ReviewForm';
import ReviewConfirmation from '@/pages/reviewer/ReviewConfirmation';
import PendingInvitations from '@/pages/reviewer/PendingInvitations';
import UserManagement from '@/pages/admin/UserManagement';
import SystemSettings from '@/pages/admin/SystemSettings';
import IssueManagement from '@/pages/admin/IssueManagement';
import PaymentManagement from '@/pages/admin/PaymentManagement';
import SystemMonitoring from '@/pages/admin/SystemMonitoring';
import ComplaintHandling from '@/pages/admin/ComplaintHandling';
import ReportGeneration from '@/pages/admin/ReportGeneration';
import CurrentIssue from '@/pages/CurrentIssue';
import Archive from '@/pages/Archive';
import ArticleView from '@/pages/ArticleView';
import About from '@/pages/About';
import AuthorGuidelines from '@/pages/AuthorGuidelines';
import PeerReview from '@/pages/PeerReview';
import EditorialBoard from '@/pages/EditorialBoard';
import Search from '@/pages/Search';
import ProtectedRoute from '@/components/ProtectedRoute';
import StyleGuide from '@/pages/StyleGuide';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main id="main-content" role="main" className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/current-issue" element={<CurrentIssue />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/articles/:doi" element={<ArticleView />} />
                <Route path="/search" element={<Search />} />
                <Route path="/about" element={<About />} />
                <Route path="/author-guidelines" element={<AuthorGuidelines />} />
                <Route path="/peer-review" element={<PeerReview />} />
                <Route path="/editorial-board" element={<EditorialBoard />} />
                <Route path="/style-guide" element={<StyleGuide />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submit-paper"
                  element={
                    <ProtectedRoute>
                      <SubmitPaper />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submission/:id"
                  element={
                    <ProtectedRoute>
                      <SubmissionDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submission/:id/revise"
                  element={
                    <ProtectedRoute>
                      <SubmitRevision />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submission/:id/payment"
                  element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submission/:id/proof"
                  element={
                    <ProtectedRoute>
                      <ProofReview />
                    </ProtectedRoute>
                  }
                />
                
                {/* Editor Routes */}
                <Route
                  path="/editor/submission/:id/screen"
                  element={
                    <ProtectedRoute>
                      <SubmissionScreening />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submission/:id/assign-reviewers"
                  element={
                    <ProtectedRoute>
                      <ReviewerAssignment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submission/:id/reviews"
                  element={
                    <ProtectedRoute>
                      <ReviewTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submission/:id/decision"
                  element={
                    <ProtectedRoute>
                      <EditorialDecision />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submission/:id/revision"
                  element={
                    <ProtectedRoute>
                      <RevisionHandling />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/production"
                  element={
                    <ProtectedRoute>
                      <ProductionWorkflow />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/decisions"
                  element={
                    <ProtectedRoute>
                      <ReviewTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submissions"
                  element={
                    <ProtectedRoute>
                      <ReviewTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submission/:id/notifications"
                  element={
                    <ProtectedRoute>
                      <EditorNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/submissions/new"
                  element={
                    <ProtectedRoute>
                      <SubmissionScreening />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/reviewers"
                  element={
                    <ProtectedRoute>
                      <ReviewerAssignment />
                    </ProtectedRoute>
                  }
                />

                {/* Reviewer Routes */}
                <Route
                  path="/reviewer/invitations"
                  element={
                    <ProtectedRoute>
                      <PendingInvitations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review/:reviewId"
                  element={
                    <ProtectedRoute>
                      <ReviewForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review/:reviewId/confirmation"
                  element={
                    <ProtectedRoute>
                      <ReviewConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review-invitation/:reviewId"
                  element={
                    <ProtectedRoute>
                      <ReviewInvitation />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute>
                      <SystemSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/issues"
                  element={
                    <ProtectedRoute>
                      <IssueManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <ProtectedRoute>
                      <PaymentManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/monitoring"
                  element={
                    <ProtectedRoute>
                      <SystemMonitoring />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/complaints"
                  element={
                    <ProtectedRoute>
                      <ComplaintHandling />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute>
                      <ReportGeneration />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
      <p className="text-xl text-secondary-600 mb-8">Page not found</p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
      >
        Go back home
      </a>
    </div>
  </div>
);

export default App;