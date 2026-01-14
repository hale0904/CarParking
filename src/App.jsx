import { RouterProvider } from 'react-router-dom';
import { router } from './routers/routing';

console.log('APP RUN, router =', router);

function App() {
  console.log('APP RENDER');

  return <RouterProvider router={router} />;
}

export default App;