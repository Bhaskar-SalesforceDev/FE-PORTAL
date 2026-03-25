# Line of Business (LOB) Field Mapping

The Case Detail page shows different fields based on the **Line of Business** from Salesforce.

## Salesforce Field Names

Ensure these fields exist on the Case object. Adjust API names in both **FEGetCasesAPI** and **CaseDetail.jsx** if your org uses different names.

| Display Label | Salesforce API Name | LOB |
|---------------|---------------------|-----|
| Line of Business | `Line_of_Business__c` | All |
| Site ID | `Site_ID__c` | Small Cell |
| Alarm Name | `Alarm_Name__c` | Small Cell |
| Circuit Id | `Circuit_Id__c` | OHFC |
| Customer Circuit Id | `Customer_Circuit_Id__c` | OHFC |
| Console Id | `Console_Id__c` | OHFC |
| Line Name | `Line_Name__c` | OHFC |
| GPON ID | `GPON_ID__c` | FTTH |
| FAT Number | `FAT_Number__c` | FTTH |

## LOB Values

The LOB field should contain one of (case-insensitive):

- **Small Cell** → Shows Site ID, Alarm Name
- **OHFC** → Shows Circuit Id, Customer Circuit Id, Console Id, Line Name
- **FTTH** → Shows GPON ID, FAT Number

## If Fields Don't Exist

If your Apex fails to deploy because a field doesn't exist:

1. Create the field in Setup → Object Manager → Case → Fields
2. Or remove that field from the SELECT in `FEGetCasesAPI.cls`
3. The frontend will show "N/A" for missing fields
