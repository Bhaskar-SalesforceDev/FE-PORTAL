const API_BASE = '/api';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
  });
  return res.json();
}

export async function getCases(email) {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });
  return res.json();
}

export async function updateCase(
  caseId,
  status,
  rca_reason,
  rca_comments,
  feEmail,
  materialNeeded,
  material1,
  material1Quantity,
  vendorName,
  civilNeeded,
  extraFields = {}
) {
  const res = await fetch(`${API_BASE}/cases/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caseId,
      Status: status,
      rca_reason,
      rca_comments,
      feEmail: feEmail?.trim?.() || '', // FE who resolved - used to filter Resolved tab
      // Salesforce API field names - required for RCA_Reason__c picklist to update
      RCA_Reason__c: rca_reason,
      RCA_Comments__c: rca_comments,
      Material_Needed__c: materialNeeded,
      Material1__c: material1,
      Material_1_Quantity__c: material1Quantity,
      Vendor_Name__c: vendorName,
      Civil_Needed__c: civilNeeded,
      ...extraFields,
    }),
  });
  return res.json();
}
