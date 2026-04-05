import { useState } from 'react';
import { api } from '../lib/api';

interface AdminUser {
  id: string;
  name?: string;
  email: string;
  status: string;
  source_page?: string;
  cta_clicked?: string;
  selected_use_case?: string;
  created_at?: string;
}

export const AdminPage = () => {
  const [secret, setSecret] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.adminListUsers(secret);
      setUsers((result.users as unknown as AdminUser[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    try {
      if (decision === 'approve') await api.adminApproveUser(id, secret);
      else await api.adminRejectUser(id, secret, 'Manual review decision');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050c18] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black mb-6">Admin Approval Panel</h1>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6 flex gap-3">
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white"
          />
          <button onClick={loadUsers} disabled={!secret || loading} className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 disabled:opacity-50">
            {loading ? 'Loading...' : 'Load users'}
          </button>
        </div>

        {error ? <p className="text-red-400 mb-4">{error}</p> : null}

        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{user.name || 'Unnamed user'} · {user.email}</p>
                <p className="text-sm text-white/60 mt-1">
                  status: {user.status} · source: {user.source_page || '—'} · cta: {user.cta_clicked || '—'} · use case: {user.selected_use_case || '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(user.id, 'approve')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">Approve</button>
                <button onClick={() => decide(user.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
