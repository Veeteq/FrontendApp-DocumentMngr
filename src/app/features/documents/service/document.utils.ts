export function extractDocumentId(location: string | null): number | null {
  if (!location) return null;
  const lastSegment = location.split('/').filter(Boolean).pop();
  const documentId = Number(lastSegment);
  return Number.isInteger(documentId) && documentId > 0 ? documentId : null;
}