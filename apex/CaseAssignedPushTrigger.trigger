trigger CaseAssignedPushTrigger on Case (after update) {
    CaseAssignedPushNotifier.enqueueForAssigned(Trigger.new, Trigger.oldMap);
}
