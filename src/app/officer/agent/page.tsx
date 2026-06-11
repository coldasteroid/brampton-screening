import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import OfficerAgentChat from '~/components/OfficerAgentChat';
import { requireRole } from '~/lib/auth';
import { getCurrentUser } from '~/lib/auth-server';

export const metadata: Metadata = { title: 'Officer Agent · FairPlan' };

export default async function OfficerAgentPage() {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) redirect(guard.redirect);

  return <OfficerAgentChat officerName={guard.user.name} />;
}
