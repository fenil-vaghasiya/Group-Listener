// Routing configuration for the synchronized client
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout.tsx';
import { Home } from '../pages/Home.tsx';
import { CreateRoom } from '../pages/CreateRoom.tsx';
import { JoinRoom } from '../pages/JoinRoom.tsx';
import { Room } from '../pages/Room.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'create',
        element: <CreateRoom />,
      },
      {
        path: 'join',
        element: <JoinRoom />,
      },
      {
        path: 'room/:roomCode',
        element: <Room />,
      },
    ],
  },
]);
