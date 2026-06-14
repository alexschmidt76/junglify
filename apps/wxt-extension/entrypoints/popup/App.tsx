import { useStore } from '@nanostores/react';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import authClient from '@/utils/auth';
import './App.css';

import JunglifyPopup from './JunglifyPopup';
import LogInForm from '@repo/react-components/auth-forms/LogInForm';
import SignUpForm from '@repo/react-components/auth-forms/SignUpForm';

function AppRoutes({ store }: { store: ReturnType<typeof useStore> }) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path='/' element={store.data ? <JunglifyPopup store={store} /> : <Navigate to="/log-in" />} />
      <Route path='/log-in' element={<LogInForm authClient={authClient} redirectFn={() => navigate('/')}/>} />
      <Route path='/sign-up' element={<SignUpForm authClient={authClient} redirectFn={() => navigate('/')}/>} />
    </Routes>
  );
}

function App() {
  const store = useStore(authClient.useSession);

  if (store.isPending) return <div>Loading...</div>;

  return (
    <MemoryRouter initialEntries={[store.data ? "/" : "/log-in"]}>
      <AppRoutes store={store} />
    </MemoryRouter>
  )
}

export default App;
