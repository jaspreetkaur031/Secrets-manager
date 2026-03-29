import React from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './lib/auth';
import { AppLayout } from './layouts/AppLayout';

// Product Pages (New)
import LandingHero from './pages/product/LandingHero';
import Workflow from './pages/product/Workflow';  // Create this next
import SecurityDocs from './pages/product/SecurityDocs'; // Create this next

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import CompareSecrets from './pages/CompareSecrets';
import SearchPage from './pages/SearchPage';
import Settings from './pages/Settings';
import Login from './pages/Login';

/**
 * ProtectedRoute Wrapper
 * Redirects unauthenticated users to login and wraps dashboard pages in AppLayout.
 */
function ProtectedRoute({ component, path }) {
  const { user } = useAuth();
  const Component = component;
  return (
    <Route path={path}>
      {(params) => user ? (
        <AppLayout>
          <Component params={params} />
        </AppLayout>
      ) : (
        <Redirect to="/login" />
      )}
    </Route>
  );
}

function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* --- Public Marketing Routes --- */}
        <Route path="/" component={LandingHero} />
        <Route path="/login" component={Login} />
        <Route path="/how-it-works" component={Workflow} />
        <Route path="/security" component={SecurityDocs} />

        {/* --- Private Dashboard Routes --- */}
        {/* We move the primary dashboard to /dashboard so '/' can be the Landing page */}
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/projects" component={Dashboard} />
        <ProtectedRoute path="/project/:slug" component={ProjectView} />
        <ProtectedRoute path="/project/:slug/compare" component={CompareSecrets} />
        <ProtectedRoute path="/search" component={SearchPage} />
        <ProtectedRoute path="/settings" component={Settings} />

        {/* --- 404 Handler --- */}
        <Route>
          <div className="flex flex-col items-center justify-center min-h-screen text-muted bg-[#020617]">
            <h1 className="text-4xl font-bold text-white mb-2">404</h1>
            <p>The page you are looking for does not exist.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 text-primary hover:underline"
            >
              Back to Home
            </button>
          </div>
        </Route>
      </Switch>
    </AuthProvider>
  );
}

export default App;