import { AppFooter } from './components/organisms/AppFooter';
import { AppRouter } from './components/screens/AppRouter';
import './styles/global.css';

export function App() {
  return (
    <div className="app-shell">
      <div className="app-content">
        <AppRouter />
      </div>
      <AppFooter />
    </div>
  );
}
