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