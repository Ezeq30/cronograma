import { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const VALID_USERS = [
    { user: 'admin', pass: 'computos' }
  ];

  function handleSubmit() {
    if (VALID_USERS.some(u => u.user === username && u.pass === password)) {
      onLogin();
    } else {
      setError(true);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img src="/image.png" alt="Logo" className="login-logo-img" />
        </div>
        <h2>Cronograma Cómputos</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={e => { setUsername(e.target.value); setError(false); }}
          onKeyDown={handleKey}
          autoFocus
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
          onKeyDown={handleKey}
        />
        <button className="btn-entrar" onClick={handleSubmit}>INGRESAR</button>
        {error && <div className="login-error">Usuario o contraseña incorrectos</div>}
      </div>
    </div>
  );
}
