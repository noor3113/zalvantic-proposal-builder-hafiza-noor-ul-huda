import { useEffect, useState } from 'react';
import QuoteWizard from './wizard/QuoteWizard';
import ProposalEditor from './components/ProposalEditor';

const API = 'http://localhost:5000/api';
const emptyForm = { name: '', basePrice: '', currency: 'USD', includes: '' };

function Nav({ view, setView, logout }) {
  const tab = (name, label) => (
    <button disabled={view === name} onClick={() => setView(name)}>
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {tab('packages', 'Packages')}
      {tab('quotes', 'Quotes')}
      {tab('proposals', 'Proposals')}
      <button onClick={logout} style={{ marginLeft: 'auto' }}>Logout</button>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState('packages');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  function logout() {
    localStorage.removeItem('token');
    setToken('');
  }

  async function loadPackages() {
    const res = await fetch(`${API}/packages`);
    setPackages(await res.json());
  }

  useEffect(() => {
    if (token) loadPackages();
  }, [token]);

  async function login(e) {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Login failed');
    if (data.role !== 'admin') return setError('Admin only');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setPassword('');
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    const body = JSON.stringify({
      name: form.name,
      basePrice: Number(form.basePrice),
      currency: form.currency,
      includes: form.includes.split(',').map((s) => s.trim()).filter(Boolean),
    });
    const url = editingId ? `${API}/packages/${editingId}` : `${API}/packages`;
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: authHeaders,
      body,
    });
    if (res.status === 401) return logout();
    if (!res.ok) {
      const d = await res.json();
      return setError(d.error || 'Save failed');
    }
    setForm(emptyForm);
    setEditingId(null);
    loadPackages();
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      basePrice: p.basePrice,
      currency: p.currency,
      includes: (p.includes || []).join(', '),
    });
  }

  async function remove(id) {
    if (!window.confirm('Delete this package?')) return;
    const res = await fetch(`${API}/packages/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (res.status === 401) return logout();
    if (!res.ok) setError('Delete failed');
    loadPackages();
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 360, margin: '60px auto', fontFamily: 'sans-serif' }}>
        <h2>Admin login</h2>
        <form onSubmit={login} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </div>
    );
  }

  if (view === 'quotes') {
    return (
      <div style={{ maxWidth: 800, margin: '30px auto', fontFamily: 'sans-serif' }}>
        <Nav view={view} setView={setView} logout={logout} />
        <QuoteWizard token={token} onUnauthorized={logout} />
      </div>
    );
  }

  if (view === 'proposals') {
    return (
      <div style={{ maxWidth: 1100, margin: '30px auto', fontFamily: 'sans-serif' }}>
        <Nav view={view} setView={setView} logout={logout} />
        <ProposalEditor token={token} onUnauthorized={logout} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '30px auto', fontFamily: 'sans-serif' }}>
      <Nav view={view} setView={setView} logout={logout} />
      <h2>Packages</h2>

      <form onSubmit={save} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="number" placeholder="Base price" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} required />
        <input placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <input placeholder="Includes (comma separated)" value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} />
        <button type="submit">{editingId ? 'Update package' : 'Add package'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
            Cancel edit
          </button>
        )}
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>Name</th><th>Price</th><th>Includes</th><th></th></tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.basePrice} {p.currency}</td>
              <td>{(p.includes || []).join(', ')}</td>
              <td>
                <button onClick={() => startEdit(p)}>Edit</button>{' '}
                <button onClick={() => remove(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}