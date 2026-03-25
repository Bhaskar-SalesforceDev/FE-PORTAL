# Why OHFC Fields (Circuit Id, Customer Circuit Id, Console Id, Line Name) Show N/A

## Checklist – Verify in Salesforce

### 1. Confirm the fields exist on the Case object

In **Setup → Object Manager → Case → Fields & Relationships**, check for:

| Display Label      | API Name (typical)      | Notes                    |
|-------------------|------------------------|--------------------------|
| Circuit Id        | `Circuit_Id__c` or `CircuitId__c` | Text field on Case |
| Customer Circuit Id | `Customer_Circuit_Id__c` or `CustomerCircuitId__c` | Text field on Case |
| Console Id        | `Console_Id__c` or `ConsoleId__c` | Text field on Case |
| Line Name         | `Line_Name__c` or `LineName__c` or `Link_Name__c` | Text field on Case |

If any field is missing, create it on the Case object.

---

### 2. Confirm the Case record has values

1. Open the Case record (e.g. Case #00181297) in Salesforce.
2. Check whether Circuit Id, Customer Circuit Id, Console Id, and Line Name have values.
3. If they are empty, either:
   - Populate them manually, or
   - Use automation (Flow, Process Builder, Apex) to populate them from related records.

---

### 3. Check if values are on a related object

If these values live on a related object (e.g. Circuit, Order, Service), you must:

1. Add a lookup/master-detail from Case to that object.
2. Query the related fields in Apex, for example:

```apex
SELECT Id, CaseNumber, ...,
       Circuit__r.Circuit_Id__c, Circuit__r.Customer_Circuit_Id__c, ...
FROM Case
```

3. Update the Apex SELECT to use the correct relationship and field names.
4. Update the frontend to read from the nested object (e.g. `caseData.Circuit__r?.Circuit_Id__c`).

---

### 4. Match API names in Apex and frontend

If your org uses different API names, update:

1. **FEGetCasesAPI.cls** – use the correct field names in the SELECT.
2. **CaseDetail.jsx** – ensure `getVal()` uses the same API names.

---

### 5. Quick SOQL test in Developer Console

Run this in **Developer Console → Query Editor**:

```sql
SELECT Id, CaseNumber, Circuit_Id__c, Customer_Circuit_Id__c, Console_Id__c, Line_Name__c
FROM Case
WHERE Id = '500HF00000EWUUTYA5'
LIMIT 1
```

- If the query fails, the field API names are wrong or the fields do not exist.
- If it succeeds but returns null/empty, the Case record simply has no data in those fields.
