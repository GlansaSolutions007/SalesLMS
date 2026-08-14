import httpClient, { toApiError } from "./axios.js";

const BASE = "/admin";

function blockFormData(blockType, content, file) {
  const fd = new FormData();
  if (blockType) fd.append("block_type", blockType);
  fd.append("content", JSON.stringify(content ?? {}));
  if (file) fd.append("file", file);
  return fd;
}

// GET .../lessons/{lesson}/content-blocks
export async function listContentBlocks(courseId, moduleId, lessonId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content-blocks`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load lesson content.");
  }
}

// POST .../content-blocks
export async function createContentBlock(courseId, moduleId, lessonId, blockType, content, file) {
  try {
    const res = await httpClient.post(
      `${BASE}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content-blocks`,
      blockFormData(blockType, content, file)
    );
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not add this block.");
  }
}

// POST .../content-blocks/{block} (method is POST, not PUT — this endpoint
// accepts multipart file replacement, which PHP won't populate for PUT/PATCH)
export async function updateContentBlock(courseId, moduleId, lessonId, blockId, content, file) {
  try {
    const res = await httpClient.post(
      `${BASE}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content-blocks/${blockId}`,
      blockFormData(null, content, file)
    );
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not save this block.");
  }
}

// POST .../content-blocks/reorder — body: { order: [blockId, blockId, ...] }
export async function reorderContentBlocks(courseId, moduleId, lessonId, orderedIds) {
  try {
    const res = await httpClient.post(
      `${BASE}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content-blocks/reorder`,
      { order: orderedIds }
    );
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not save the new block order.");
  }
}

// POST .../content-blocks/{block}/duplicate
export async function duplicateContentBlock(courseId, moduleId, lessonId, blockId) {
  try {
    const res = await httpClient.post(
      `${BASE}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content-blocks/${blockId}/duplicate`
    );
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not duplicate this block.");
  }
}

// DELETE .../content-blocks/{block}
export async function deleteContentBlock(courseId, moduleId, lessonId, blockId) {
  try {
    await httpClient.delete(`${BASE}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content-blocks/${blockId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete this block.");
  }
}
