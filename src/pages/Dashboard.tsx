import React from 'react';
import { ClientDashboard } from '../components/ClientDashboard';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';
import { DashboardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Helmet>
        <title>V12 Dashboard | Command Center</title>
      </Helmet>
      <ClientDashboard />
    </>
  );
}
