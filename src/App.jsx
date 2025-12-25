import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginRegister from './Components/LoginRegister/LoginRegister';
import SuccessPage from './Components/SuccessPage';
import Profile from './Components/Profile';
import EditProfile from './Components/EditProfile';
import Shoutout from './Components/Shoutout';
import FeedPage from './Components/FeedPage'; // 👈 Import the new container
import Navbar from './Components/Navbar';
import './App.css'

function Layout({ children }) {
  const location = useLocation();
  // Hide Navbar on Login and Success pages
  const isAuthPage = location.pathname === '/' || location.pathname === '/success';

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className={!isAuthPage ? "pt-24 px-4" : ""}>
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginRegister />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/shoutout" element={<Shoutout />} />
          {/* 🆕 Global Feed Route */}
          <Route path="/feed" element={<FeedPage />} /> 
        </Routes>
      </Layout>
    </Router>
  )
}

export default App;