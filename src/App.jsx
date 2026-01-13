import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import LayoutAdmin from './app/c-app/c-layout/layout-default/layout-default';
import { NotFound } from './app/c-app/c-layout/notFound';

function App() {
  const router = createBrowserRouter([{
    path: "/admin",
    element:<LayoutAdmin />,
    errorElement: <NotFound />,
  }]);

  // return <RouterProvider router={router} />;
}

export default App;
