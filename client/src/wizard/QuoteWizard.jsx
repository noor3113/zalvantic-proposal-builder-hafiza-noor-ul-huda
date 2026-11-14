import { useEffect, useState } from 'react';
import { z } from 'zod';

const API = 'http://localhost:5000/api';

const step1Schema = z.object({
  clientName: z.string().trim().min(2, 'Name is too short'),
  clientEmail: z.string().trim().email('Invalid email'),
  company: z.string().trim().optional(),
});
const step2Schema = z.object({
  items: z
    .array(z.object({ package: z.string(), addOns: z.array(z.string()) }))
    .min(1, 'Choose at least one package'),
});
const step3Schema = z.object({
  currency: z.enum(['USD', 'EUR', 'PKR']),
  rush: z.boolean(),
  notes: z.string().trim().max(500, 'Notes are too long').optional(),
});
const schemas = { 1: step1Schema, 2: step2Schema, 3: step3Schema };
const titles = ['Client details', 'Packages', 'Options', 'Review'];

const emptyData = {
  clientName: '',
  clientEmail: '',
  company: '',
  items: [],
  currency: 'USD',
  rush: false,
  notes: '',
};

export default function QuoteWizard({ token, onUnauthorized }) {
  const [quotes, setQuotes] = useState([]);
  const [packages, setPackages] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [quote, setQuote] = useState(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState(emptyData);
  const [errors, setErrors] = useState({});
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
      const err = new Error(body.error || 'Request failed');
      err.issues = body.issues;
      throw err;
    }
    return body;
  }

  useEffect(() => {
    async function load() {
      try {
        const [p, a, q] = await Promise.all([
          api('/packages'),
          api('/addons'),
          api('/quotes'),
        ]);
        setPackages(p);
        setAddOns(a);
        setQuotes(q);
      } catch (e) {
        setMessage(e.message);
      }
    }
    load();
  }, []);

  function openQuote(q) {
    setQuote(q);
    setData({
      clientName: q.clientName || '',
      clientEmail: q.clientEmail || '',
      company: q.company || '',
      items: (q.items || []).map((i) => ({
        package: i.package,
        addOns: i.addOns || [],
      })),
      currency: q.currency || 'USD',
      rush: !!q.rush,
      notes: q.notes || '',
    });
    setStep(q.status === 'submitted' ? 4 : Math.min(q.currentStep || 1, 4));
    setErrors({});
    setMessage('');
  }

  async function startNew() {
    try {
      openQuote(await api('/quotes', { method: 'POST' }));
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function leave() {
    setQuote(null);
    setMessage('');
    try {
      setQuotes(await api('/quotes'));
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function saveStep(exitAfter) {
    const parsed = schemas[step].safeParse(data);
    if (!parsed.success) {
      const errs = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] || 'form'] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const saved = await api(`/quotes/${quote._id}/steps/${step}`, {
        method: 'PUT',
        body: JSON.stringify(parsed.data),
      });
      setQuote(saved);
      if (exitAfter) {
        await leave();
        setMessage('Draft saved. You can resume it from the list.');
      } else {
        setStep(step + 1);
      }
    } catch (e) {
      if (e.issues) {
        const errs = {};
        e.issues.forEach((i) => {
          errs[i.path.split('.')[0] || 'form'] = i.message;
        });
        setErrors(errs);
      } else {
        setMessage(e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      await api(`/quotes/${quote._id}/submit`, { method: 'POST' });
      await leave();
      setMessage('Quote submitted.');
    } catch (e) {
      const extra = e.issues ? ': ' + e.issues.map((i) => i.message).join(', ') : '';
      setMessage(e.message + extra);
    } finally {
      setBusy(false);
    }
  }

  function togglePackage(id) {
    const exists = data.items.some((i) => i.package === id);
    setData({
      ...data,
      items: exists
        ? data.items.filter((i) => i.package !== id)
        : [...data.items, { package: id, addOns: [] }],
    });
  }

  function toggleAddOn(pkgId, addOnId) {
    setData({
      ...data,
      items: data.items.map((i) =>
        i.package !== pkgId
          ? i
          : {
              ...i,
              addOns: i.addOns.includes(addOnId)
                ? i.addOns.filter((a) => a !== addOnId)
                : [...i.addOns, addOnId],
            }
      ),
    });
  }

  const pkgName = (id) => packages.find((p) => p._id === id)?.name || id;
  const addOnName = (id) => addOns.find((a) => a._id === id)?.name || id;

  const field = (name, label, props = {}) => (
    <label style={{ display: 'grid', gap: 4 }}>
      {label}
      <input
        value={data[name]}
        onChange={(e) => setData({ ...data, [name]: e.target.value })}
        {...props}
      />
      {errors[name] && <span style={{ color: 'crimson' }}>{errors[name]}</span>}
    </label>
  );

  // ---------- List of quotes ----------
  if (!quote) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Quotes</h2>
          <button onClick={startNew}>New quote</button>
        </div>
        {message && <p>{message}</p>}
        {quotes.length === 0 ? (
          <p>No quotes yet.</p>
        ) : (
          <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Step</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q._id}>
                  <td>{q.clientName || '(not entered yet)'}</td>
                  <td>{q.status}</td>
                  <td>{q.status === 'draft' ? `${Math.min(q.currentStep, 4)} of 4` : '-'}</td>
                  <td>{new Date(q.updatedAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => openQuote(q)}>
                      {q.status === 'draft' ? 'Resume' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // ---------- Wizard ----------
  const locked = quote.status === 'submitted';

  return (
    <div>
      <button onClick={leave}>← All quotes</button>
      <h2>
        Step {step} of 4: {titles[step - 1]}
      </h2>
      {locked && <p>This quote is already submitted (read only).</p>}
      {message && <p style={{ color: 'crimson' }}>{message}</p>}

      <fieldset disabled={locked} style={{ border: 'none', padding: 0 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {step === 1 && (
            <>
              {field('clientName', 'Client name')}
              {field('clientEmail', 'Client email')}
              {field('company', 'Company (optional)')}
            </>
          )}

          {step === 2 && (
            <>
              {packages.map((p) => {
                const item = data.items.find((i) => i.package === p._id);
                return (
                  <div key={p._id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!item}
                        onChange={() => togglePackage(p._id)}
                      />{' '}
                      {p.name} ({p.basePrice} {p.currency})
                    </label>
                    {item &&
                      addOns
                        .filter((a) => (a.appliesTo || []).includes(p._id))
                        .map((a) => (
                          <div key={a._id} style={{ marginLeft: 28 }}>
                            <label>
                              <input
                                type="checkbox"
                                checked={item.addOns.includes(a._id)}
                                onChange={() => toggleAddOn(p._id, a._id)}
                              />{' '}
                              Add-on: {a.name} (+{a.price})
                            </label>
                          </div>
                        ))}
                  </div>
                );
              })}
              {errors.items && <span style={{ color: 'crimson' }}>{errors.items}</span>}
            </>
          )}

          {step === 3 && (
            <>
              <label style={{ display: 'grid', gap: 4 }}>
                Currency
                <select
                  value={data.currency}
                  onChange={(e) => setData({ ...data, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="PKR">PKR</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={data.rush}
                  onChange={(e) => setData({ ...data, rush: e.target.checked })}
                />{' '}
                Rush delivery
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Notes
                <textarea
                  rows={4}
                  value={data.notes}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                />
                {errors.notes && <span style={{ color: 'crimson' }}>{errors.notes}</span>}
              </label>
            </>
          )}

          {step === 4 && (
            <div>
              <p><b>Client:</b> {data.clientName} ({data.clientEmail}){data.company ? `, ${data.company}` : ''}</p>
              <p><b>Packages:</b></p>
              <ul>
                {data.items.map((i) => (
                  <li key={i.package}>
                    {pkgName(i.package)}
                    {i.addOns.length > 0 && ` + ${i.addOns.map(addOnName).join(', ')}`}
                  </li>
                ))}
              </ul>
              <p><b>Currency:</b> {data.currency} | <b>Rush:</b> {data.rush ? 'Yes' : 'No'}</p>
              {data.notes && <p><b>Notes:</b> {data.notes}</p>}
              <p><i>The price is calculated in Week 3.</i></p>
            </div>
          )}
        </div>
      </fieldset>

      {!locked && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {step > 1 && (
            <button disabled={busy} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 4 && (
            <>
              <button disabled={busy} onClick={() => saveStep(false)}>
                Save and continue
              </button>
              <button disabled={busy} onClick={() => saveStep(true)}>
                Save draft and exit
              </button>
            </>
          )}
          {step === 4 && (
            <button disabled={busy} onClick={submit}>
              Submit quote
            </button>
          )}
        </div>
      )}
    </div>
  );
}