import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DemoMenu } from './components/Layout';
import { useSession } from './api/store';
import Landing from './portals/public/Landing';
import Directory from './portals/public/Directory';
import EmployerLogin from './portals/public/EmployerLogin';
import Register from './portals/public/Register';
import EmployeeLogin from './portals/public/EmployeeLogin';
import MolLogin from './portals/public/MolLogin';
import EmployerPortal from './portals/employer/EmployerPortal';
import EmployeePortal from './portals/employee/EmployeePortal';
import MolPortal from './portals/mol/MolPortal';

function Guard({ role, children }: { role: 'employer' | 'employee' | 'mol'; children: JSX.Element }) {
  const s = useSession();
  if (!s || s.role !== role) return <Navigate to={`/login/${role}`} replace />;
  return children;
}

// HashRouter keeps the static build working on GitHub Pages with no server rewrites.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/login/employer" element={<EmployerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login/employee" element={<EmployeeLogin />} />
        <Route path="/login/mol" element={<MolLogin />} />
        <Route path="/employer/*" element={<Guard role="employer"><EmployerPortal /></Guard>} />
        <Route path="/employee/*" element={<Guard role="employee"><EmployeePortal /></Guard>} />
        <Route path="/mol/*" element={<Guard role="mol"><MolPortal /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DemoMenu />
    </HashRouter>
  );
}
