import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { PublicLayout } from './components/layout/PublicLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PtoListPage = lazy(() => import('./pages/PtoListPage'))
const PtoFormPage = lazy(() => import('./pages/PtoFormPage'))
const PtoDetailPage = lazy(() => import('./pages/PtoDetailPage'))
const ReplyGeneratorPage = lazy(() => import('./pages/ReplyGeneratorPage'))
const SavedRepliesPage = lazy(() => import('./pages/SavedRepliesPage'))
const HandoverDashboardPage = lazy(() => import('./pages/HandoverDashboardPage'))
const TaskFormPage = lazy(() => import('./pages/TaskFormPage'))
const HandoverSummaryPage = lazy(() => import('./pages/HandoverSummaryPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pto" element={<PtoListPage />} />
            <Route path="/pto/new" element={<PtoFormPage />} />
            <Route path="/pto/:id" element={<PtoDetailPage />} />
            <Route path="/pto/:id/edit" element={<PtoFormPage />} />
            <Route path="/replies/new" element={<ReplyGeneratorPage />} />
            <Route path="/replies" element={<SavedRepliesPage />} />
            <Route path="/handover" element={<HandoverDashboardPage />} />
            <Route path="/handover/new" element={<TaskFormPage />} />
            <Route path="/handover/summary" element={<HandoverSummaryPage />} />
            <Route path="/handover/:id/edit" element={<TaskFormPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
