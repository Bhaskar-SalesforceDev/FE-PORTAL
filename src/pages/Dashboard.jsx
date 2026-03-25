import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCases } from '../api/client';
import CaseItem from '../components/CaseItem';
import { subscribeForAssignedCaseNotifications } from '../utils/pushNotifications';

const TABS = ['Assigned', 'Resolved', 'Closed'];

function filterByTab(cases, tabIndex) {
  const s = (status) => (status || '').trim().toLowerCase();
  return cases.filter((c) => {
    const status = s(c.Status);
    switch (tabIndex) {
      case 0:
        return ['assigned', 'in progress', 'rework', 'on hold'].includes(status);
      case 1:
        return status === 'resolved';
      default:
        return status === 'closed';
    }
  });
}

const TAB_MAP = { assigned: 0, resolved: 1, closed: 2 };

export default function Dashboard() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const tabParam = searchParams.get('tab') || 'assigned';
  const [tab, setTab] = useState(TAB_MAP[tabParam] ?? 0);

  // Sync tab with URL when navigating with ?tab=resolved (e.g. after resolving a case)
  useEffect(() => {
    const tabIndex = TAB_MAP[tabParam] ?? 0;
    setTab(tabIndex);
  }, [tabParam]);

  const fetchCases = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCases(email);
      if (res.success && res.cases) {
        const userEmail = email.toLowerCase();
        const raw = res.cases || res.records || [];
        const filtered = raw.filter((r) => {
          const siteEmail = (r.ExtIPEmail__c || r.Site__r?.IPEmail__c || r.IPEmail__c || '').trim().toLowerCase();
          return siteEmail === userEmail;
        });
        setCases(filtered);
        if (filtered.length === 0) setError(`No cases found for ${email}`);
      } else {
        setError(res.message || 'Failed to load cases');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [email]);

  useEffect(() => {
    // Best-effort subscription: do not block dashboard if notifications fail/denied.
    subscribeForAssignedCaseNotifications(email).catch(() => {});
  }, [email]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const filtered = filterByTab(cases, tab);
  const isAssignedTab = tab === 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/header-logo.png"
              alt="Company logo"
              className="h-7 sm:h-8 w-auto object-contain flex-shrink-0"
              loading="eager"
            />
            <h1 className="text-lg sm:text-xl font-display font-bold truncate">Cases Dashboard</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={fetchCases}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-indigo-500 transition tap-highlight-none disabled:opacity-50"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 rounded-lg hover:bg-indigo-500 transition tap-highlight-none flex items-center gap-1.5"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <div className="flex border-b border-slate-200 bg-white">
          {TABS.map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i)}
              className={`flex-1 py-3 sm:py-4 text-sm font-medium transition tap-highlight-none ${
                tab === i
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <main className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm text-center">
                  {error}
                </div>
              )}
              <p className="text-slate-500 text-sm mb-4">Showing {filtered.length} cases</p>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <svg className="w-12 h-12 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No cases found</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filtered.map((c) => (
                    <CaseItem
                      key={c.Id}
                      case={c}
                      showAssignedMeta={isAssignedTab}
                      nowMs={nowMs}
                      onClick={() => navigate(`/case/${c.Id}?readOnly=${!isAssignedTab}`)}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
