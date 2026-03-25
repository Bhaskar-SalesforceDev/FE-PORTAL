public with sharing class CaseAssignedPushNotifier implements Queueable, Database.AllowsCallouts {
    private List<Id> caseIds;

    public CaseAssignedPushNotifier(List<Id> caseIds) {
        this.caseIds = caseIds == null ? new List<Id>() : caseIds;
    }

    // Production: use a Named Credential configured with the backend base URL.
    // Inside the Named Credential, configure a custom header `x-notify-token`
    // with the same value as `PUSH_NOTIFY_TOKEN` in your server .env.
    private static final String NOTIFY_NAMED_CREDENTIAL = 'FE_Push_Notify_NC';
    private static final String NOTIFY_PATH = '/api/push/notify-assigned';

    public static void enqueueForAssigned(List<Case> newList, Map<Id, Case> oldMap) {
        if (newList == null || newList.isEmpty()) return;

        List<Id> ids = new List<Id>();
        for (Case c : newList) {
            Case oldC = oldMap == null ? null : oldMap.get(c.Id);
            String newStatus = c.Status == null ? '' : c.Status.trim().toLowerCase();
            String oldStatus = oldC == null || oldC.Status == null ? '' : oldC.Status.trim().toLowerCase();

            if (newStatus == 'assigned' && oldStatus != 'assigned') {
                ids.add(c.Id);
            }
        }

        if (!ids.isEmpty()) {
            System.enqueueJob(new CaseAssignedPushNotifier(ids));
        }
    }

    public void execute(QueueableContext context) {
        if (caseIds == null || caseIds.isEmpty()) return;

        List<Case> assignedCases = [
            SELECT Id, CaseNumber, ExtIPEmail__c, Status
            FROM Case
            WHERE Id IN :caseIds
        ];

        Http http = new Http();
        for (Case c : assignedCases) {
            if (String.isBlank(c.ExtIPEmail__c)) continue;
            if (c.Status == null || c.Status.trim().toLowerCase() != 'assigned') continue;

            HttpRequest req = new HttpRequest();
            // Named Credential callout endpoint
            req.setEndpoint('callout:' + NOTIFY_NAMED_CREDENTIAL + NOTIFY_PATH);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setTimeout(120000);

            Map<String, Object> body = new Map<String, Object>{
                'email' => c.ExtIPEmail__c,
                'caseId' => c.Id,
                'caseNumber' => c.CaseNumber
            };
            req.setBody(JSON.serialize(body));

            try {
                HttpResponse res = http.send(req);
                System.debug('Push notify response for case ' + c.Id + ': ' + res.getStatusCode() + ' ' + res.getBody());
            } catch (Exception ex) {
                System.debug('Push notify failed for case ' + c.Id + ': ' + ex.getMessage());
            }
        }
    }
}
