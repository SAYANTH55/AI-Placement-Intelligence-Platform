import React, { useEffect, useState } from 'react';
import API from '../../services/api';

/**
 * BatchSelector – reusable dropdown to select a batch.
 * Fetches distinct batch values from the PR list endpoint.
 */
export default function BatchSelector({ selectedBatch, setSelectedBatch }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await API.get('/provisioning/prs');
        const data = res.data?.data || [];
        const uniq = [...new Set(data.map((pr) => pr.batch).filter(Boolean))];
        setBatches(uniq);
      } catch (e) {
        console.error('Failed to load batches', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-black uppercase text-secondary-muted">Batch</label>
      <select
        disabled={loading}
        value={selectedBatch || ''}
        onChange={(e) => setSelectedBatch(e.target.value || null)}
        className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
      >
        <option value="">All Batches</option>
        {batches.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}
