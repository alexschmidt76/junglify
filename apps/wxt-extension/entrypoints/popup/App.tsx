import { useStore } from '@nanostores/react';
import authClient from '@/utils/auth';
import './App.css';

function App() {
  const store = useStore(authClient.useSession);

  if (store.isPending) return <div>Loading...</div>;

  if (!store.data) return // <AuthFormChoice />;

  return //<JunglifyPopup user={store.data.user} />;
}

export default App;
