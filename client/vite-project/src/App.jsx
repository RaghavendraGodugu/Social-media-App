import './App.css'
import Login from './Pages/Login.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './Pages/Signup.jsx'
import Landing from './Pages/Landing.jsx'
import Home from './Pages/Home.jsx'
import { AuthProvider } from './context/AuthContext'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './Pages/Profile.jsx'
import NotificationToast from './components/NotificationToast'
import socket from './socket.js'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addLiveNotification, fetchNotifications } from './redux/notificationsSlice'

function AppRoutes() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      if (user?._id) {
        socket.emit("join_user", user._id);
      }
    };

    const handleNewNotification = (notification) => {
      console.log("Realtime notification received:", notification);
      dispatch(addLiveNotification(notification));
    };

    socket.on("connect", handleConnect);
    socket.on("new_notification", handleNewNotification);

    socket.connect();

    if (user?._id) {
      socket.emit("join_user", user._id);
      dispatch(fetchNotifications());
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new_notification", handleNewNotification);
    };
  }, [user?._id, dispatch]);

  return (
    <>
      <NotificationToast />
      <Routes>
        <Route path='/' element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
        <Route path='/signup' element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path='/profile/:username' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;