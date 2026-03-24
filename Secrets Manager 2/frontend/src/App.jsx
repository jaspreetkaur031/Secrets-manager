import React from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './lib/auth';
import { AppLayout } from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import CompareSecrets from './pages/CompareSecrets';
import SearchPage from './pages/SearchPage';
import Login from './pages/Login';

function ProtectedRoute({ component: Component, path }) {
  const { user } = useAuth();
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
        <Route path="/login" component={Login} />

        {/* Protected Routes */}
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/projects" component={Dashboard} />
        <ProtectedRoute path="/project/:slug" component={ProjectView} />
        <ProtectedRoute path="/project/:slug/compare" component={CompareSecrets} />
        <ProtectedRoute path="/search" component={SearchPage} />

        <Route>
          <div className="p-8 text-center text-muted">Page not found</div>
        </Route>
      </Switch>
    </AuthProvider>
  );
}

export default App;
