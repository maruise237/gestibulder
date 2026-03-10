import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getEnterprise, getUserProfile } from '@/lib/server/enterprise.actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [enterpriseRes, profileRes] = await Promise.all([getEnterprise(), getUserProfile()]);

  const enterprise = 'enterprise' in enterpriseRes ? enterpriseRes.enterprise : null;
  const userProfile = 'profile' in profileRes ? profileRes.profile : null;

  return (
    <DashboardShell enterprise={enterprise} userProfile={userProfile}>
      {children}
    </DashboardShell>
  );
}
