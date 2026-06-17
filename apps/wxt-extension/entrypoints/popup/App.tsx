import { useStore } from '@nanostores/react';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import authClient from '@/utils/auth';

import JunglifyPopup from './JunglifyPopup';
import LogInForm from '@repo/react-components/auth-forms/LogInForm';
import SignUpForm from '@repo/react-components/auth-forms/SignUpForm';

function AppRoutes({ store }: { store: ReturnType<typeof useStore> }) {
  const navigate = useNavigate();
  
  const callback = async (...params: string[]) => {
    const token = params[1] || '';
    // wait for the background to store the token + popup info before we route,
    // then refresh the session store so '/' renders the popup instead of
    // bouncing back to /log-in (username sign-in doesn't auto-refresh it)
    await browser.runtime.sendMessage({
      type: 'LOG_IN',
      token,
    });
    await authClient.useSession.get().refetch();
    navigate('/');
  }

  return (
    <Routes>
      <Route path='/' element={store.data ? <JunglifyPopup user={store.data.user} /> : <Navigate to="/log-in" />} />
      <Route path='/log-in' element={<LogInForm authClient={authClient} callbackFn={callback} onNavigate={(path) => navigate(path)} />} />
      <Route path='/sign-up' element={<SignUpForm authClient={authClient} callbackFn={callback} onNavigate={(path) => navigate(path)} />} />
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
