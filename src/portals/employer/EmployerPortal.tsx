import { Navigate, Route, Routes } from 'react-router-dom';
import { PortalLayout } from '../../components/Layout';
import { useT } from '../../i18n';
import { useDb, useSession } from '../../api/store';
import Dashboard from './Dashboard';
import Employees from './Employees';
import BulkUpload from './BulkUpload';
import Disputes from './Disputes';

export default function EmployerPortal() {
  const { t, isAr } = useT();
  const db = useDb();
  const s = useSession();
  if (s?.role !== 'employer') return null;
  const employer = db.employers.find((e) => e.id === s.employerId);
  if (!employer) return <Navigate to="/login/employer" replace />;
  const open = db.disputes.filter((d) => d.employerId === employer.id && d.status === 'employer_review').length;

  return (
    <PortalLayout
      portal={t('landing.employer')}
      user={isAr ? employer.companyNameAr : employer.companyName}
      nav={[
        { to: '/employer', label: t('employer.nav.dashboard'), end: true },
        { to: '/employer/employees', label: t('employer.nav.employees') },
        { to: '/employer/bulk', label: t('employer.nav.bulk') },
        { to: '/employer/disputes', label: t('employer.nav.disputes'), badge: open },
      ]}
    >
      <Routes>
        <Route index element={<Dashboard employer={employer} />} />
        <Route path="employees" element={<Employees employer={employer} />} />
        <Route path="bulk" element={<BulkUpload employer={employer} />} />
        <Route path="disputes" element={<Disputes employer={employer} />} />
      </Routes>
    </PortalLayout>
  );
}
