import { useState } from "react";
import { useYAuth } from "../providers/YauthProvider";


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const {yauth} = useYAuth();
  
    const handleSubmit = (e : React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
        setMessage('Please fill in all fields.');
        return;
      }
      setMessage('Login successful!');
      yauth.signIn({
          email,
          password
      }).then((value) => {
        console.log(value)
    });
    };


  
    return (
      <div style={{ width: '300px', margin: '50px auto', textAlign: 'center' }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label><br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>
            Login
          </button>
        </form>
        {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
      </div>
    );
}

export default LoginPage
