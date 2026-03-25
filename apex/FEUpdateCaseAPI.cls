@RestResource(urlMapping='/feapi/updatecase')
global with sharing class FEUpdateCaseAPI {

    // ✅ Response Wrapper
    global class UpdateResponse {
        public Boolean success;
        public String message;
    }

    private static void aliasIfMissing(
        Map<String, Object> requestData,
        Map<String, Schema.SObjectField> caseFields,
        String fromKey,
        List<String> toKeys
    ) {
        if (!requestData.containsKey(fromKey)) return;
        Object v = requestData.get(fromKey);
        for (String k : toKeys) {
            if (requestData.containsKey(k)) continue;
            if (!caseFields.containsKey(k)) continue;
            requestData.put(k, v);
        }
    }

    @HttpPut
    global static void updateCase() {

        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // ✅ Parse JSON dynamically
            Map<String, Object> requestData =
                (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());

            // ✅ Validate caseId
            if (!requestData.containsKey('caseId') || requestData.get('caseId') == null) {
                res.statusCode = 400;

                UpdateResponse errorRes = new UpdateResponse();
                errorRes.success = false;
                errorRes.message = 'caseId is required';

                res.responseBody = Blob.valueOf(JSON.serialize(errorRes));
                return;
            }

            Id caseId = (Id) requestData.get('caseId');

            // ✅ Fetch Case
            List<Case> caseList = [SELECT Id FROM Case WHERE Id = :caseId LIMIT 1];

            if (caseList.isEmpty()) {
                res.statusCode = 404;

                UpdateResponse errorRes = new UpdateResponse();
                errorRes.success = false;
                errorRes.message = 'Case not found';

                res.responseBody = Blob.valueOf(JSON.serialize(errorRes));
                return;
            }

            Case c = caseList[0];

            // ✅ Get all Case fields dynamically
            Map<String, Schema.SObjectField> caseFields =
                Schema.SObjectType.Case.fields.getMap();

            // ✅ Support multiple API-name variants for Customer Updates (org-to-org differences)
            aliasIfMissing(
                requestData,
                caseFields,
                'Customer_Update_1__c',
                new List<String>{ 'Customer_Update1__c', 'CustomerUpdate1__c' }
            );
            aliasIfMissing(
                requestData,
                caseFields,
                'Customer_Update_2__c',
                new List<String>{ 'Customer_Update2__c', 'CustomerUpdate2__c' }
            );
            aliasIfMissing(
                requestData,
                caseFields,
                'Customer_Update_1_Date_Time__c',
                new List<String>{
                    'Customer_Update_1_DateTime__c',
                    'Customer_Update1_Date_Time__c',
                    'Customer_Update1_DateTime__c',
                    'CustomerUpdate1DateTime__c'
                }
            );
            aliasIfMissing(
                requestData,
                caseFields,
                'Customer_Update_2_Date_Time__c',
                new List<String>{
                    'Customer_Update_2_DateTime__c',
                    'Customer_Update2_Date_Time__c',
                    'Customer_Update2_DateTime__c',
                    'CustomerUpdate2DateTime__c'
                }
            );

            // ✅ Loop through request and update fields
            for (String key : requestData.keySet()) {

                // Skip caseId
                if (key == 'caseId') continue;

                Object value = requestData.get(key);

                // ✅ Special handling: FE Email when Resolved
                if (key == 'feEmail') {
                    if (requestData.containsKey('Status') &&
                        String.valueOf(requestData.get('Status')) == 'Resolved') {

                        c.put('Resolved_By_FE_Email__c', String.valueOf(value));
                    }
                    continue;
                }

                // ✅ Update only valid Case fields
                if (caseFields.containsKey(key)) {

                    Schema.DescribeFieldResult fieldDesc =
                        caseFields.get(key).getDescribe();

                    // 🔥 Handle DateTime fields
                    if (value != null &&
                        fieldDesc.getType() == Schema.DisplayType.DateTime) {

                        String s = String.valueOf(value).trim();

                        if (!String.isBlank(s)) {
                            s = s.replace('T', ' ');
                            if (s.length() == 16) s += ':00';

                            c.put(key, Datetime.valueOf(s));
                        } else {
                            // Allow clearing DateTime fields
                            c.put(key, null);
                        }

                    } else {
                        // Normal fields
                        c.put(key, value);
                    }
                }
            }

            // ✅ Update record
            update c;

            // ✅ Success Response
            UpdateResponse successRes = new UpdateResponse();
            successRes.success = true;
            successRes.message = 'Case Updated Successfully';

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(successRes));

        } catch (Exception e) {

            // ❌ Error Handling
            UpdateResponse errorRes = new UpdateResponse();
            errorRes.success = false;
            errorRes.message = e.getMessage();

            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(errorRes));
        }
    }
}