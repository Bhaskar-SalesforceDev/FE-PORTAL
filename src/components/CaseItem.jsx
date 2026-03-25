import StatusChip from './StatusChip';

function formatDateTime(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function formatSla(createdAt, nowMs) {
  if (!createdAt) return 'N/A';
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return 'N/A';
  const dueMs = createdMs + (4 * 60 * 60 * 1000); // 4 hours SLA
  const diffMs = dueMs - nowMs;
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hhmm = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return diffMs >= 0 ? `${hhmm} remaining` : `${hhmm} overdue`;
}

export default function CaseItem({ case: c, onClick, showAssignedMeta = false, nowMs = Date.now() }) {
  const caseNumber = c.CaseNumber ?? c.caseNumber ?? 'N/A';
  const status = c.Status ?? c.status ?? 'Unknown';
  // LOB: Line of Business - controls which fields to show
  const lob = (c.Line_of_Business__c ?? c.LOB__c ?? c.lineOfBusiness ?? '').trim();
  const lobNormalized = lob.toLowerCase();

  const getVal = (obj, ...keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return 'N/A';
  };

  const siteId = getVal(c, 'Site_ID__c', 'siteId');
  const actualIncidentTimeCustomer = getVal(
    c,
    'Outage_Start_Time_Customer__c',
    'OutageStartTimeCustomer__c',
    'outageStartTimeCustomer'
  );

  // OHFC identifiers
  const circuitId = getVal(c, 'Circuit_ID__c', 'Circuit_Id__c', 'CircuitId__c', 'circuitId');
  const consoleId = getVal(c, 'Console_Route_ID__c', 'Console_Id__c', 'ConsoleId__c', 'consoleId');
  const linkName = getVal(c, 'PathName__c', 'Line_Name__c', 'LineName__c', 'Link_Name__c', 'lineName');

  // FTTH identifiers
  const gponId = getVal(c, 'GPON_ID__c', 'GPONID__c', 'gponId');
  const fatNumber = getVal(c, 'FAT_Number__c', 'FATNumber__c', 'fatNumber');

  const isOHFC = lobNormalized === 'ohfc';
  const isFTTH = lobNormalized === 'ftth';
  const showSiteId = !isOHFC && !isFTTH;
  const createdDateRaw = c.CreatedDate ?? c.createdDate ?? null;
  const createdDateLabel = formatDateTime(createdDateRaw);
  const slaLabel = formatSla(createdDateRaw, nowMs);

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition tap-highlight-none active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-indigo-600 text-base sm:text-lg">
              Case #{caseNumber}
            </p>
            <dl className="mt-2 text-slate-600 text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
              {showSiteId && (
                <div className="min-w-0">
                  <dt className="text-slate-500 font-medium">Site ID</dt>
                  <dd className="truncate" title={siteId !== 'N/A' ? siteId : undefined}>{siteId}</dd>
                </div>
              )}

              <div className="min-w-0">
                <dt className="text-slate-500 font-medium">LOB</dt>
                <dd className="truncate" title={lob ? lob : undefined}>{lob || 'N/A'}</dd>
              </div>

              <div className="min-w-0 sm:col-span-2">
                <dt className="text-slate-500 font-medium">Actual Incident Time - Customer</dt>
                <dd className="break-words whitespace-normal" title={actualIncidentTimeCustomer !== 'N/A' ? actualIncidentTimeCustomer : undefined}>
                  {actualIncidentTimeCustomer}
                </dd>
              </div>

              {isOHFC && (
                <>
                  <div className="min-w-0">
                    <dt className="text-slate-500 font-medium">Link Name</dt>
                    <dd className="truncate" title={linkName !== 'N/A' ? linkName : undefined}>{linkName}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500 font-medium">Circuit ID</dt>
                    <dd className="truncate" title={circuitId !== 'N/A' ? circuitId : undefined}>{circuitId}</dd>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-slate-500 font-medium">Console ID</dt>
                    <dd className="break-words whitespace-normal" title={consoleId !== 'N/A' ? consoleId : undefined}>{consoleId}</dd>
                  </div>
                </>
              )}

              {isFTTH && (
                <>
                  <div className="min-w-0">
                    <dt className="text-slate-500 font-medium">GPON ID</dt>
                    <dd className="truncate" title={gponId !== 'N/A' ? gponId : undefined}>{gponId}</dd>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-slate-500 font-medium">FAT Number</dt>
                    <dd className="break-words whitespace-normal" title={fatNumber !== 'N/A' ? fatNumber : undefined}>
                      {fatNumber}
                    </dd>
                  </div>
                </>
              )}

              {showAssignedMeta && (
                <>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-slate-500 font-medium">Created Date</dt>
                    <dd className="break-words whitespace-normal">{createdDateLabel}</dd>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-slate-500 font-medium">SLA (4 Hours)</dt>
                    <dd className={`${slaLabel.includes('overdue') ? 'text-red-600 font-medium' : ''}`}>
                      {slaLabel}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
          <StatusChip status={status} />
        </div>
      </button>
    </li>
  );
}
