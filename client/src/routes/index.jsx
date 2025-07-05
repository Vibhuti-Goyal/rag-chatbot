import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import LoginPage from '../Authentication/Login/login';
import Dashboard from '../pages/DashBoard/dashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
    ],
  },
]);

export default router;