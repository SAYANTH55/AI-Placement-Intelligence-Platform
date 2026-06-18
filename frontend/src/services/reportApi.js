/**
 * reportApi.js
 * -----------
 * Frontend service for generating and downloading the
 * Placement Intelligence Dossier PDF.
 */

import API from './api';

/**
 * Generate and download the Placement Intelligence Dossier.
 *
 * @param {Object|null} livePayload - The analyzedData from context (fallback when no DB record).
 * @param {number|null}  userId     - Admin override: target student user_id (admin/PR only).
 * @returns {Promise<void>}          Triggers browser file download.
 */
export async function generateDossier(livePayload = null, userId = null) {
  const body = {};
  if (livePayload) body.live_payload = livePayload;
  if (userId)      body.user_id      = userId;

  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const response = await API.post('/reports/generate-dossier', body, {
    responseType: 'blob',
    timeout: 180_000, // 3 minutes — LLM + Playwright can take time
    headers: { 
      'Accept': 'application/pdf',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
  });

  // Build a temporary object URL and trigger the download
  const blob     = new Blob([response.data], { type: 'application/pdf' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  anchor.href    = url;
  anchor.download = 'Placement_Intelligence_Dossier.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Check whether a cached (fresh) dossier exists for the current user.
 *
 * @returns {Promise<{has_analysis: boolean, report_cached: boolean, report_is_fresh: boolean, generated_at: string|null, file_size_kb: number|null}>}
 */
export async function getDossierStatus() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const response = await API.get('/reports/dossier-status', {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return response.data;
}
