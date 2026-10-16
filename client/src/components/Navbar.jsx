import { useNavigate } from "react-router-dom";

function Navbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <nav style={navStyle}>
        <div style={logoStyle}>FinTrack</div>
        <div style={rightStyle}>
            {user && <span style={emailStyle}>{user.email}</span>}
            <button onClick={handleLogout} style={logoutStyle}>Log out</button>
        </div>
    </nav>
  )
}

const navStyle = {
    wdith: '100%',
    height: '60px',
    backgroundColor: '#1a2e1a',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0, 40px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
}

const logoStyle = {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: '.5px',
}

const rightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
}

const emailStyle = {
    color: '#aaa',
    fontSize: '13px',
}

const logoutStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #ffffff30',
    color: '#fff',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
}

export default Navbar;
