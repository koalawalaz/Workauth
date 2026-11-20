import { Navigate, Route, Routes } from 'react-router-dom';
import { PortalLayout } from '../../components/Layout';
import { useT } from '../../i18n';
import { useDb, useSession } from '../../api/store';
import Overview from './Overview';
import EmployerList from './EmployerList';
import EmployerDetail from './EmployerDetail';
import { EscalatedDisputes, AllInspections, Inspectors, Weights, AuditLog } from './Admin';

export default function MolPortal() {
  const { t } = useT();
  const db = useDb();
  const s = useSession();
  if (s?.role !== 'mol') return null;
  const me = db.inspectors.find((i) => i.id === s.inspectorId);
  if (!me) return <Navigate to="/login/mol" replace />;
  const escalated = db.disputes.filter((d) => d.status === 'escalated').length;
  const isAdmin = me.role === 'admin';

  return (
    <PortalLayout
      portal={t('landing.mol')}
      user={me.name}
      nav={[
        { to: '/mol', label: t('mol.nav.overview'), end: true },
        { to: '/mol/employers', label: t('mol.nav.employers') },
        { to: '/mol/disputes', label: t('mol.nav.disputes'), badge: escalated },
        { to: '/mol/inspections', label: t('mol.nav.inspections') },
        ...(isAdmin
          ? [
              { to: '/mol/inspectors', label: t('mol.nav.inspectors') },
              { to: '/mol/weights', label: t('mol.nav.weights') },
            ]
          : []),
        { to: '/mol/audit', label: t('mol.nav.audit') },
      ]}
    >
      <Routes>
        <Route index element={<Overview />} />
        <Route path="employers" element={<EmployerList me={me} />} />
        <Route path="employers/:id" element={<EmployerDetail me={me} />} />
        <Route path="disputes" element={<EscalatedDisputes me={me} />} />
        <Route path="inspections" element={<AllInspections />} />
        <Route path="inspectors" element={isAdmin ? <Inspectors me={me} /> : <Navigate to="/mol" />} />
        <Route path="weights" element={isAdmin ? <Weights me={me} /> : <Navigate to="/mol" />} />
        <Route path="audit" element={<AuditLog />} />
      </Routes>
    </PortalLayout>
  );
}
