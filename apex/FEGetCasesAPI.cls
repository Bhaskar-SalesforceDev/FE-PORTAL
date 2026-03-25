@RestResource(urlMapping='/feapi/getcases')
global with sharing class FEGetCasesAPI {

    global class CaseRequest {
        public String email;
    }

    global class CaseResponse {
        public Boolean success;
        public String message;
        public List<Case> cases;
    }

    @HttpPost
    global static void getCases() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            CaseRequest requestData = (CaseRequest) JSON.deserialize(req.requestBody.toString(), CaseRequest.class);

            Map<String, Schema.SObjectField> caseFields = Schema.SObjectType.Case.fields.getMap();
            List<String> selectFields = new List<String>{
                'Id','CaseNumber','Status','CreatedDate','Site_ID__c','Alarm_Name__c','Line_of_Business__c','Origin','Site__r.IPEmail__c','ExtIPEmail__c',
                'RCA_Reason__c','RCA_Comments__c','Resolved_By_FE_Email__c',
                'Circuit_ID__c','CustomerCircuitId__c','Console_Route_ID__c','PathName__c',
                'GPON_ID__c','FAT_Number__c',
                'Material_Needed__c','Material1__c','Material_1_Quantity__c','current_Status__c',
                'Vendor_Name__c','Civil_Needed__c',
                'Restoration_Update_1__c','Restoration_Update_1_Date_Time__c',
                'Restoration_Update_2__c','Restoration_Update_2_Date_Time__c',
                'Restoration_Update_3__c','Restoration_Update_3_Date_Time__c',
                'Restoration_Update_4__c','Restoration_Update_4_Date_Time__c',
                'CE_Team_Acknowledgement__c','Vendor_Splicer_Assigned__c','Splicer_Available__c','Splicer_Acknowledgement__c',
                'Team_Reached_Time_Mark_On_Site__c','Fault_Identification__c','Fault_Found__c','Restoration_Start__c',
                'Other_Materials__c','Cable_Start_Reading__c','Cable_ID__c','PPE_Compliance__c','Cable_End_Reading__c',
                'A_Latlong__c','B_Latlong__c',
                'Vendor_Update_1__c','Vendor_Update_1_Date_Time__c',
                'Vendor_Update_2__c','Vendor_Update_2_Date_Time__c',
                'Vendor_Update_3__c','Vendor_Update_3_Date_Time__c',
                'Vendor_Update_4__c','Vendor_Update_4_Date_Time__c',
                'Vendor_Update_5__c','Vendor_Update_5_Date_Time__c',
                'Check_The_Link_Status_Date_Time__c','Generic_Cause_of_Cable_Cut__c','Delay_Reason__c','Laser_Status__c'
            };

            // Customer Update fields may exist with different API names; include whatever exists.
            List<String> customerUpdateCandidates = new List<String>{
                'Customer_Update_1__c','Customer_Update1__c','CustomerUpdate1__c',
                'Customer_Update_1_Date_Time__c','Customer_Update_1_DateTime__c','Customer_Update1_Date_Time__c','Customer_Update1_DateTime__c','CustomerUpdate1DateTime__c',
                'Customer_Update_2__c','Customer_Update2__c','CustomerUpdate2__c',
                'Customer_Update_2_Date_Time__c','Customer_Update_2_DateTime__c','Customer_Update2_Date_Time__c','Customer_Update2_DateTime__c','CustomerUpdate2DateTime__c'
            };
            for (String f : customerUpdateCandidates) {
                if (caseFields.containsKey(f) && !selectFields.contains(f)) selectFields.add(f);
            }

            // Restoration Update fields (new Customer Updates API names)
            List<String> restorationUpdateCandidates = new List<String>{
                'Restoration_Update_1__c','Restoration_Update_1_Date_Time__c',
                'Restoration_Update_2__c','Restoration_Update_2_Date_Time__c',
                'Restoration_Update_3__c','Restoration_Update_3_Date_Time__c',
                'Restoration_Update_4__c','Restoration_Update_4_Date_Time__c'
            };
            for (String f : restorationUpdateCandidates) {
                if (caseFields.containsKey(f) && !selectFields.contains(f)) selectFields.add(f);
            }

            String soql =
                'SELECT ' + String.join(selectFields, ', ') +
                ' FROM Case ' +
                ' WHERE ExtIPEmail__c = :requestData.email ' +
                ' AND ( ' +
                '   Status IN (\\'Assigned\\',\\'In Progress\\',\\'Rework\\',\\'On Hold\\') ' +
                '   OR (Status = \\'' + 'Resolved' + '\\' AND Resolved_By_FE_Email__c = :requestData.email) ' +
                '   OR Status = \\'' + 'Closed' + '\\' ' +
                ' ) ' +
                ' ORDER BY CreatedDate DESC';

            List<Case> caseList = Database.query(soql);

            CaseResponse responseObj = new CaseResponse();
            responseObj.success = true;
            responseObj.message = 'Cases Fetched';
            responseObj.cases = caseList;

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseObj));

        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(e.getMessage());
        }
    }
}
