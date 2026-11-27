import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function ProposalEditor({ token, onUnauthorized }) {
  const [proposals, setProposals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quoteId, setQuoteId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [current, setCurrent] = useState(null);
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 401) {
      onUnauthorized();
      throw new Error('Session expired');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const extra = body.issues ? ': ' + body.issues.map((i) => i.message).join(', ') : '';
      throw new Error((body.error || 'Request failed') + extra);
    }
    return body;
  }

  async function loadAll() {
    try {
      const [p, t, q] = await Promise.all([
        api('/proposals'),
        api('/templates'),
        api('/quotes'),
      ]);
      const submitted = q.filter((x) => x.status === 'submitted');
      setProposals(p);
      setTemplates(t);
      setQuotes(submitted);
      setQuoteId((id) => id || submitted[0]?._id || '');
      setTemplateId((id) => id || t[0]?._id || '');
    } catch (e) {
      setMessage(e.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openProposal(p) {
    setCurrent(p);
    setTitle(p.title);
    setSections(p.sections.map((s) => ({ key: s.key, title: s.title, body: s.body })));
    setPrice(null);
    setMessage('');
    api(`/quotes/${p.quoteId}/price`)
      .then(setPrice)
      .catch(() => setPrice(null));
  }

  async function createProposal() {
    if (!quoteId || !templateId) {
      setMessage('Choose a submitted quote and a template first.');
      return;
    }
    setBusy(true);
    try {
      const created = await api('/proposals', {
        method: 'POST',
        body: JSON.stringify({ quoteId, templateId }),
      });
      openProposal(created);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!title.trim()) {
      setMessage('Title is required.');
      return;
    }
    if (sections.some((s) => !s.title.trim())) {
      setMessage('Every section needs a title.');
      return;
    }
    setBusy(true);
    try {
      const saved = await api(`/proposals/${current._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, sections }),
      });
      setCurrent(saved);
      setMessage('Saved.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setCurrent(null);
    setMessage('');
    await loadAll();
  }

  function updateSection(i, field, value) {
    setSections(sections.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addSection() {
    setSections([...sections, { key: `custom-${Date.now()}`, title: 'New section', body: '' }]);
  }

  function removeSection(i) {
    if (sections.length === 1) return;
    setSections(sections.filter((_, idx) => idx !== i));
  }

  function moveSection(i, direction) {
    const j = i + direction;
    if (j < 0 || j >= sections.length) return;
    const copy = [...sections];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setSections(copy);
  }

  // ---------- List ----------
  if (!current) {
    return (
      <div>
        <h2>Proposals</h2>
        {message && <p style={{ color: 'crimson' }}>{message}</p>}

        <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
          <b>New proposal from a template</b>
          <select value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
            {quotes.length === 0 && <option value="">No submitted quotes yet</option>}
            {quotes.map((q) => (
              <option key={q._id} value={q._id}>
                {q.clientName} ({q.total} {q.currency})
              </option>
            ))}
          </select>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <button disabled={busy} onClick={createProposal}>Create from template</button>
        </div>

        {proposals.length === 0 ? (
          <p>No proposals yet.</p>
        ) : (
          <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Title</th><th>Status</th><th>Updated</th><th></th></tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p._id}>
                  <td>{p.title}</td>
                  <td>{p.status}</td>
                  <td>{new Date(p.updatedAt).toLocaleString()}</td>
                  <td><button onClick={() => openProposal(p)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // ---------- Editor with live preview ----------
  const locked = current.status !== 'draft';

  return (
    <div>
      <button onClick={leave}>← All proposals</button>
      <h2>Edit proposal</h2>
      {locked && <p>This proposal is not a draft, so it is read only.</p>}
      {message && (
        <p style={{ color: message === 'Saved.' ? 'lightgreen' : 'crimson' }}>{message}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <fieldset disabled={locked} style={{ border: 'none', padding: 0 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            {sections.map((s, i) => (
              <div key={s.key} style={{ border: '1px solid #555', padding: 8, display: 'grid', gap: 6 }}>
                <input value={s.title} onChange={(e) => updateSection(i, 'title', e.target.value)} />
                <textarea rows={4} value={s.body} onChange={(e) => updateSection(i, 'body', e.target.value)} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => moveSection(i, -1)}>Up</button>
                  <button type="button" onClick={() => moveSection(i, 1)}>Down</button>
                  <button type="button" onClick={() => removeSection(i)}>Remove</button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addSection}>Add section</button>
            <button type="button" disabled={busy} onClick={save}>Save proposal</button>
          </div>
        </fieldset>

        <div>
          <b>Live preview</b>
          <div style={{ background: '#fff', color: '#111', padding: 20, borderRadius: 6, marginTop: 8 }}>
            <h2 style={{ marginTop: 0 }}>{title || 'Untitled'}</h2>
            {sections.map((s) => (
              <div key={s.key}>
                <h3>{s.title}</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{s.body}</p>
                {s.key === 'pricing' && price && (
                  <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr><td>Subtotal</td><td>{price.subtotal} USD</td></tr>
                      {price.rushFee > 0 && (
                        <tr><td>Rush fee</td><td>{price.rushFee} USD</td></tr>
                      )}
                      <tr>
                        <td><b>Total</b></td>
                        <td><b>{price.total} {price.currency}</b></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}