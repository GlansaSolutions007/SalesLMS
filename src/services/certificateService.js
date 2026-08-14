import httpClient, { toApiError } from "./axios.js";

// GET /companies/{company}/my-learning/certificates?search=&status=&year=&category_id=&page=&per_page=
export async function getMyCertificates(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-learning/certificates`, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load your certificates.");
  }
}

// GET /companies/{company}/my-learning/certificates/{certificate}
export async function getMyCertificate(companyId, certificateId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-learning/certificates/${certificateId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this certificate.");
  }
}

// GET /certificates/verify/{certificateNo}
export async function verifyCertificate(certificateNo) {
  try {
    const res = await httpClient.get(`/certificates/verify/${certificateNo}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not verify this certificate.");
  }
}
