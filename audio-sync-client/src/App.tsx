import { RouterProvider } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import { AudioStreamProvider } from './context/AudioStreamContext';
import { router } from './routes';

function App() {
  return (
    <RoomProvider>
      <AudioStreamProvider>
        <RouterProvider router={router} />
      </AudioStreamProvider>
    </RoomProvider>
  );
}

export default App;
