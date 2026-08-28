import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Mail, Phone, User } from 'lucide-react';
import api from './api';

const ROLE_LABELS = {
  b2c_student: 'Independent researcher',
  b2b_student: 'Institutional student',
  college_admin: 'College administrator',
  super_admin: 'Platform administrator',
};

function initialsFor(form, user) {
  const first = (form.first_name || '').trim();
  const last = (form.last_name || '').trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  const source = form.username || user?.username || 'U';
  return source.slice(0, 2).toUpperCase();
}

function displayName(form, user) {
  const full = `${form.first_name || ''} ${form.last_name || ''}`.trim();
  return full || form.username || user?.username || 'Your profile';
}

export default function ProfilePage({ user, onProfileUpdate }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [collegeName, setCollegeName] = useState(user?.college_name || '');
  const [role, setRole] = useState(user?.role || '');
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('accounts/profile/');
        const next = {
          username: res.data.username || '',
          email: res.data.email || '',
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          phone: res.data.phone || '',
          department: res.data.department || '',
        };
        setForm(next);
        setCollegeName(res.data.college_name || '');
        setRole(res.data.role || user?.role || '');
        setSnapshot({
          username: next.username,
          first_name: next.first_name,
          last_name: next.last_name,
          department: next.department,
        });
      } catch (e) {
        console.error('Unable to load profile', e);
        setError('Unable to load profile information.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.role]);

  const dirty = useMemo(() => {
    if (!snapshot) return false;
    return (
      form.username !== snapshot.username
      || form.first_name !== snapshot.first_name
      || form.last_name !== snapshot.last_name
      || form.department !== snapshot.department
    );
  }, [form, snapshot]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setMessage('');
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = 'User ID is required.';
    setFieldErrors(next);
    return next;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setError('Please correct the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone,
        department: form.department.trim(),
      };

      const updated = await api.put('accounts/profile/', payload);
      const saved = {
        username: updated.data.username || payload.username,
        email: updated.data.email || form.email,
        first_name: updated.data.first_name || payload.first_name,
        last_name: updated.data.last_name || payload.last_name,
        phone: updated.data.phone || form.phone,
        department: updated.data.department || payload.department,
      };
      setForm(saved);
      setSnapshot({
        username: saved.username,
        first_name: saved.first_name,
        last_name: saved.last_name,
        department: saved.department,
      });
      setCollegeName(updated.data.college_name || collegeName);
      setRole(updated.data.role || role);
      setMessage('Profile updated successfully.');
      window.localStorage.setItem('user', JSON.stringify(updated.data));
      if (onProfileUpdate) onProfileUpdate(updated.data);
    } catch (err) {
      console.error('Profile save failed', err);
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-shell">
        <div className="profile-loading">
          <span className="spinner" />
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[role] || 'Account';

  return (
    <form className="profile-shell" onSubmit={handleSave} noValidate>
      <div className="profile-scroll">
        <header className="profile-masthead">
          <div className="profile-identity">
            <span className="profile-avatar" aria-hidden="true">{initialsFor(form, user)}</span>
            <div>
              <p className="profile-kicker">Account settings</p>
              <h2>{displayName(form, user)}</h2>
              <p>Update your name and affiliation. Email and phone are locked to this account.</p>
            </div>
          </div>
          <div className="profile-chips">
            <span className="profile-chip">{roleLabel}</span>
            {collegeName && <span className="profile-chip is-gold">{collegeName}</span>}
          </div>
        </header>

        {message && (
          <div className="profile-banner is-success" role="status">
            <Check size={16} strokeWidth={2.4} />
            {message}
          </div>
        )}
        {error && <div className="profile-banner is-error" role="alert">{error}</div>}

        <section className="profile-section">
          <div className="profile-section-copy">
            <span className="profile-section-icon"><User size={16} strokeWidth={1.9} /></span>
            <h3>Personal details</h3>
            <p>Your name appears as corresponding author on new submissions. Contact details cannot be edited here.</p>
          </div>
          <div className="profile-fields">
            <label className="profile-field">
              <span>First name</span>
              <input className="form-control" value={form.first_name} onChange={handleChange('first_name')} autoComplete="given-name" />
            </label>
            <label className="profile-field">
              <span>Last name</span>
              <input className="form-control" value={form.last_name} onChange={handleChange('last_name')} autoComplete="family-name" />
            </label>
            <label className="profile-field">
              <span>Email address</span>
              <div className="profile-input-wrap">
                <Mail size={16} />
                <input className="form-control" type="email" value={form.email} readOnly disabled />
              </div>
              <small>Email cannot be changed.</small>
            </label>
            <label className="profile-field">
              <span>Phone</span>
              <div className="profile-input-wrap">
                <Phone size={16} />
                <input className="form-control" type="tel" value={form.phone || '—'} readOnly disabled />
              </div>
              <small>Phone number cannot be changed.</small>
            </label>
          </div>
        </section>

        <section className="profile-section is-last">
          <div className="profile-section-copy">
            <span className="profile-section-icon"><Building2 size={16} strokeWidth={1.9} /></span>
            <h3>Account &amp; affiliation</h3>
            <p>Your login identifier and institutional details used across InnoresearX.</p>
          </div>
          <div className="profile-fields">
            <label className={`profile-field ${fieldErrors.username ? 'is-invalid' : ''}`}>
              <span>User ID</span>
              <input className="form-control" value={form.username} onChange={handleChange('username')} autoComplete="username" required />
              {fieldErrors.username ? <em>{fieldErrors.username}</em> : <small>This is the identifier you use to sign in.</small>}
            </label>
            <label className="profile-field">
              <span>Department / school</span>
              <input
                className="form-control"
                value={form.department}
                onChange={handleChange('department')}
                placeholder="e.g. Computer Science"
              />
            </label>
            <label className="profile-field">
              <span>Institution</span>
              <input className="form-control" value={collegeName || 'Independent account'} readOnly disabled />
              <small>{collegeName ? 'Linked through your college administrator.' : 'Not linked to a college.'}</small>
            </label>
            <label className="profile-field">
              <span>Role</span>
              <input className="form-control" value={roleLabel} readOnly disabled />
            </label>
          </div>
        </section>
      </div>

      <div className="profile-bar">
        <p>{dirty ? 'You have unsaved changes.' : 'Your profile is up to date.'}</p>
        <button type="submit" className="btn btn-primary profile-save" disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
