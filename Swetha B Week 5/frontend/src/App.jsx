import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginRegister from './components/LoginRegister/LoginRegister';
import SuccessPage from './components/SuccessPage';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import Navbar from './components/Navbar';
import ShoutOutFeed from './components/ShoutOutFeed';
import './App.css'


function Layout({ children }) {
  const location = useLocation();
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
          <Route path="/feed" element={<ShoutOutFeed />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
