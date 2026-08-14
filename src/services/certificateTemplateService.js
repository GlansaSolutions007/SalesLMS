import httpClient, { toApiError } from "./axios.js";

const BASE = "/admin";

// Certificate Template Master — global, Super-Admin-only. No company-wise
// scoping on any of these endpoints (see CertificateTemplateController).

export async function listCertificateTemplates(params = {}) {
  try {
    const res = await httpClient.get(`${BASE}/certificate-templates`, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load certificate templates.");
  }
}

export async function getCertificateTemplate(id) {
  try {
    const res = await httpClient.get(`${BASE}/certificate-templates/${id}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this certificate template.");
  }
}

export async function createCertificateTemplate(payload) {
  try {
    const res = await httpClient.post(`${BASE}/certificate-templates`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create certificate template.");
  }
}

export async function updateCertificateTemplate(id, payload) {
  try {
    const res = await httpClient.put(`${BASE}/certificate-templates/${id}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update certificate template.");
  }
}

export async function toggleCertificateTemplateStatus(id, status) {
  try {
    const res = await httpClient.patch(`${BASE}/certificate-templates/${id}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update template status.");
  }
}

// "Only ONE template can be marked as Default... automatically remove the
// Default flag from the previous template" — enforced server-side; this
// just triggers it.
export async function setDefaultCertificateTemplate(id) {
  try {
    const res = await httpClient.patch(`${BASE}/certificate-templates/${id}/set-default`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not set this template as Default.");
  }
}

export async function duplicateCertificateTemplate(id) {
  try {
    const res = await httpClient.post(`${BASE}/certificate-templates/${id}/duplicate`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not duplicate this template.");
  }
}

export async function deleteCertificateTemplate(id) {
  try {
    await httpClient.delete(`${BASE}/certificate-templates/${id}`);
  } catch (err) {
    throw toApiError(err, "Could not delete this template.");
  }
}
