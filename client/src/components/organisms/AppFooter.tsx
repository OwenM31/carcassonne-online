/**
 * @description Global footer shown across the application shell.
 */
import { APP_VERSION } from '../../config/version';

export function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="app-footer__text">Carcassonne Online · Version {APP_VERSION}</p>
    </footer>
  );
}
