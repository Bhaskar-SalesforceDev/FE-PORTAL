# Salesforce Apex Changes for "FE-Resolved Only" in Resolved Tab

The Resolved tab will show **only** cases that the Field Engineer (FE) personally resolved via the portal (changed In Progress → Resolved and clicked Update).

## 1. Create Custom Field on Case Object

In Salesforce Setup → Object Manager → Case → Fields & Relationships → New:

- **Field Label:** Resolved By FE Email
- **Field Name:** Resolved_By_FE_Email__c
- **Data Type:** Text or Email (Length: 255)
- **Visible:** Yes (optional - can hide from layouts if not needed)

---

## 2. Update FEUpdateCaseAPI (updatecase)

Add `feEmail` to the request and set `Resolved_By_FE_Email__c` when status is Resolved:

```apex
global class UpdateRequest {
    public String caseId;
    public String Status;
    public String rca_reason;
    public String rca_comments;
    public String feEmail;   // ADD THIS - FE who resolved via portal
}
```

In the update logic, after setting Status and RCA fields:

```apex
c.Status = requestData.Status;
if (requestData.rca_reason != null) {
    c.RCA_Reason__c = requestData.rca_reason;
}
c.RCA_Comments__c = requestData.rca_comments;

// ADD: When FE resolves via portal, track who resolved
if (requestData.Status == 'Resolved' && String.isNotBlank(requestData.feEmail)) {
    c.Resolved_By_FE_Email__c = requestData.feEmail.trim();
}

update c;
```

---

## 3. Update FEGetCasesAPI (getcases)

Add `Resolved_By_FE_Email__c` to the SELECT and filter Resolved cases to only those this FE resolved:

```apex
List<Case> caseList = [
    SELECT Id, CaseNumber, Status, Site_ID__c, Alarm_Name__c, Origin, Site__r.IPEmail__c,
           RCA_Reason__c, RCA_Comments__c, Resolved_By_FE_Email__c
    FROM Case
    WHERE Site__r.IPEmail__c = :requestData.email
    AND (
        Status IN('Assigned', 'In Progress', 'Rework', 'On Hold')
        OR (Status = 'Resolved' AND Resolved_By_FE_Email__c = :requestData.email)
        OR Status = 'Closed'
    )
    ORDER BY CreatedDate DESC
];
```

**Logic:**
- **Assigned tab:** Status = Assigned, In Progress, Rework, On Hold (all cases for this site)
- **Resolved tab:** Status = Resolved **AND** Resolved_By_FE_Email__c = this FE's email (only cases this FE resolved via portal)
- **Closed tab:** Status = Closed (all closed cases for this site)

---

## Summary

| Tab      | Cases Shown                                                                 |
|----------|-----------------------------------------------------------------------------|
| Assigned | All cases with Assigned, In Progress, Rework, On Hold for this FE's site     |
| Resolved | Only cases this FE changed to Resolved via the portal (Resolved_By_FE_Email__c = FE email) |
| Closed   | All Closed cases for this FE's site                                         |
