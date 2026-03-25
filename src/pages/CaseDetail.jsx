import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCases, updateCase } from '../api/client';

const STATUS_OPTIONS = ['In Progress', 'Assigned', 'Resolved', 'Rework', 'Closed'];

const RCA_OPTIONS = [
  'Auto Restored',
  'Cable cut by Local Authority person ( MSEB/BMC/BESCOM/PMC etc )',
  'Cable cut/damge due to construction work',
  'Core Damage _Single core',
  'Core damage in UG',
  'Core issue',
  'CRQ / CUTOVER planned',
  'DRIVE _ Cable cutting',
  'DRIVE _ Tree cutting',
  'DUPLICATE TT',
  'Fat Power OK , Need to forward to HDO bin',
  'Fiber / Network damage by LCO',
  'Fiber cut by Unknow person',
  'Fiber cut due to heavy vehicle movement',
  'Fiber cut in Tiffin box',
  'Input Patch code Removed in FAT / FDC',
  'No issue in CE media',
  'NON CE CASE',
  'OTHER ISSUE',
  'Patch code Damage',
  'Pigtail Damage',
  'RAT bite',
  'SFP RELATED ISSUE',
  'Offline TT',
];

export default function CaseDetail() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { email } = useAuth();
  const readOnlyParam = searchParams.get('readOnly') === 'true';

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [status, setStatus] = useState('');
  const [rcaReason, setRcaReason] = useState('');
  const [rcaComments, setRcaComments] = useState('');
  const [materialNeeded, setMaterialNeeded] = useState('');
  const [material1, setMaterial1] = useState('');
  const [material1Quantity, setMaterial1Quantity] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [currentVendorStatus, setCurrentVendorStatus] = useState('');
  const [civilNeeded, setCivilNeeded] = useState('');

  // Customer Updates (Restoration Updates)
  const [restorationUpdate1, setRestorationUpdate1] = useState('');
  const [restorationUpdate1DateTime, setRestorationUpdate1DateTime] = useState('');
  const [restorationUpdate2, setRestorationUpdate2] = useState('');
  const [restorationUpdate2DateTime, setRestorationUpdate2DateTime] = useState('');
  const [restorationUpdate3, setRestorationUpdate3] = useState('');
  const [restorationUpdate3DateTime, setRestorationUpdate3DateTime] = useState('');
  const [restorationUpdate4, setRestorationUpdate4] = useState('');
  const [restorationUpdate4DateTime, setRestorationUpdate4DateTime] = useState('');

  // Vendor section (additional fields)
  const [ceTeamAcknowledgement, setCeTeamAcknowledgement] = useState('');
  const [vendorSplicerAssigned, setVendorSplicerAssigned] = useState('');
  const [splicerAlignDateTime, setSplicerAlignDateTime] = useState('');
  const [splicerAcknowledgement, setSplicerAcknowledgement] = useState('');
  const [teamReachedTimeMarkOnSite, setTeamReachedTimeMarkOnSite] = useState('');
  const [faultIdentification, setFaultIdentification] = useState('');
  const [faultFound, setFaultFound] = useState('');
  const [restorationStart, setRestorationStart] = useState('');
  const [otherMaterials, setOtherMaterials] = useState('');
  const [cableStartReading, setCableStartReading] = useState('');
  const [cableId, setCableId] = useState('');
  const [ppeCompliance, setPpeCompliance] = useState('');
  const [cableEndReading, setCableEndReading] = useState('');
  const [aEndLatlong, setAEndLatlong] = useState('');
  const [bEndLatlong, setBEndLatlong] = useState('');
  const [vendorUpdate1, setVendorUpdate1] = useState('');
  const [vendorUpdate1DateTime, setVendorUpdate1DateTime] = useState('');
  const [vendorUpdate2, setVendorUpdate2] = useState('');
  const [vendorUpdate2DateTime, setVendorUpdate2DateTime] = useState('');
  const [vendorUpdate3, setVendorUpdate3] = useState('');
  const [vendorUpdate3DateTime, setVendorUpdate3DateTime] = useState('');
  const [vendorUpdate4, setVendorUpdate4] = useState('');
  const [vendorUpdate4DateTime, setVendorUpdate4DateTime] = useState('');
  const [vendorUpdate5, setVendorUpdate5] = useState('');
  const [vendorUpdate5DateTime, setVendorUpdate5DateTime] = useState('');
  const [checkTheLinkStatusDateTime, setCheckTheLinkStatusDateTime] = useState('');
  const [genericCauseOfCableCut, setGenericCauseOfCableCut] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [laserStatus, setLaserStatus] = useState('');
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showRcaSheet, setShowRcaSheet] = useState(false);

  const isReadOnly = readOnlyParam;

  const toDatetimeLocal = (v) => {
    if (v == null) return '';
    const s = String(v).trim();
    if (!s) return '';
    // Already in browser-friendly format: YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s;

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const firstNonEmpty = (obj, ...keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== '') return v;
    }
    return '';
  };

  useEffect(() => {
    async function load() {
      if (!email || !caseId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getCases(email);
        const raw = res.cases || res.records || [];
        const userEmail = email.toLowerCase();
        const all = raw.filter((r) => {
          const siteEmail = (r.ExtIPEmail__c || r.Site__r?.IPEmail__c || r.IPEmail__c || '').trim().toLowerCase();
          return siteEmail === userEmail;
        });
        const found = all.find((c) => (c.Id || c.id) === caseId);
        if (found) {
          setCaseData(found);
          setStatus(found.Status || found.status || 'In Progress');
          setRcaReason(found.RCA_Reason__c || found.rcaReason || '');
          setRcaComments(found.RCA_Comments__c || found.rcaComments || '');
          const rawMaterialNeeded = (found.Material_Needed__c || found.materialNeeded || '').trim();
          // Normalise YES/NO from Salesforce to match UI options
          setMaterialNeeded(rawMaterialNeeded ? rawMaterialNeeded.toUpperCase() : '');
          setMaterial1(found.Material1__c || found.material1 || '');
          setMaterial1Quantity(
            found.Material_1_Quantity__c != null ? String(found.Material_1_Quantity__c) : ''
          );
          setVendorName(found.Vendor_Name__c || found.vendorName || '');
          setCurrentVendorStatus(String(found.current_Status__c || found.Current_Status__c || found.currentVendorStatus || ''));
          const rawCivilNeeded = (found.Civil_Needed__c || found.civilNeeded || '').trim();
          setCivilNeeded(rawCivilNeeded ? rawCivilNeeded.toUpperCase() : '');

          setRestorationUpdate1(String(found.Restoration_Update_1__c || found.restorationUpdate1 || ''));
          setRestorationUpdate1DateTime(
            toDatetimeLocal(found.Restoration_Update_1_Date_Time__c || found.restorationUpdate1DateTime || '')
          );
          setRestorationUpdate2(String(found.Restoration_Update_2__c || found.restorationUpdate2 || ''));
          setRestorationUpdate2DateTime(
            toDatetimeLocal(found.Restoration_Update_2_Date_Time__c || found.restorationUpdate2DateTime || '')
          );
          setRestorationUpdate3(String(found.Restoration_Update_3__c || found.restorationUpdate3 || ''));
          setRestorationUpdate3DateTime(
            toDatetimeLocal(found.Restoration_Update_3_Date_Time__c || found.restorationUpdate3DateTime || '')
          );
          setRestorationUpdate4(String(found.Restoration_Update_4__c || found.restorationUpdate4 || ''));
          setRestorationUpdate4DateTime(
            toDatetimeLocal(found.Restoration_Update_4_Date_Time__c || found.restorationUpdate4DateTime || '')
          );

          setCeTeamAcknowledgement(toDatetimeLocal(found.CE_Team_Acknowledgement__c || found.ceTeamAcknowledgement || ''));
          setVendorSplicerAssigned(String(found.Vendor_Splicer_Assigned__c || found.vendorSplicerAssigned || ''));
          setSplicerAlignDateTime(toDatetimeLocal(found.Splicer_Available__c || found.splicerAlignDateTime || ''));
          setSplicerAcknowledgement(
            toDatetimeLocal(found.Splicer_Acknowledgement__c || found.splicerAcknowledgement || '')
          );
          setTeamReachedTimeMarkOnSite(
            toDatetimeLocal(found.Team_Reached_Time_Mark_On_Site__c || found.teamReachedTimeMarkOnSite || '')
          );

          const rawFaultId = (found.Fault_Identification__c || found.faultIdentification || '').trim();
          setFaultIdentification(rawFaultId ? rawFaultId.toUpperCase() : '');
          setFaultFound(toDatetimeLocal(found.Fault_Found__c || found.faultFound || ''));
          setRestorationStart(toDatetimeLocal(found.Restoration_Start__c || found.restorationStart || ''));
          setOtherMaterials(String(found.Other_Materials__c || found.otherMaterials || ''));
          setCableStartReading(String(found.Cable_Start_Reading__c || found.cableStartReading || ''));
          setCableId(String(found.Cable_ID__c || found.cableId || ''));

          const rawPpe = (found.PPE_Compliance__c || found.ppeCompliance || '').trim();
          setPpeCompliance(rawPpe ? rawPpe.toUpperCase() : '');

          setCableEndReading(String(found.Cable_End_Reading__c || found.cableEndReading || ''));
          setAEndLatlong(String(found.A_Latlong__c || found.aEndLatlong || ''));
          setBEndLatlong(String(found.B_Latlong__c || found.bEndLatlong || ''));

          setVendorUpdate1(String(found.Vendor_Update_1__c || found.vendorUpdate1 || ''));
          setVendorUpdate1DateTime(
            toDatetimeLocal(found.Vendor_Update_1_Date_Time__c || found.vendorUpdate1DateTime || '')
          );
          setVendorUpdate2(String(found.Vendor_Update_2__c || found.vendorUpdate2 || ''));
          setVendorUpdate2DateTime(
            toDatetimeLocal(found.Vendor_Update_2_Date_Time__c || found.vendorUpdate2DateTime || '')
          );
          setVendorUpdate3(String(found.Vendor_Update_3__c || found.vendorUpdate3 || ''));
          setVendorUpdate3DateTime(
            toDatetimeLocal(found.Vendor_Update_3_Date_Time__c || found.vendorUpdate3DateTime || '')
          );
          setVendorUpdate4(String(found.Vendor_Update_4__c || found.vendorUpdate4 || ''));
          setVendorUpdate4DateTime(
            toDatetimeLocal(found.Vendor_Update_4_Date_Time__c || found.vendorUpdate4DateTime || '')
          );
          setVendorUpdate5(String(found.Vendor_Update_5__c || found.vendorUpdate5 || ''));
          setVendorUpdate5DateTime(
            toDatetimeLocal(found.Vendor_Update_5_Date_Time__c || found.vendorUpdate5DateTime || '')
          );

          setCheckTheLinkStatusDateTime(
            toDatetimeLocal(found.Check_The_Link_Status_Date_Time__c || found.checkTheLinkStatusDateTime || '')
          );
          setGenericCauseOfCableCut(String(found.Generic_Cause_of_Cable_Cut__c || found.genericCauseOfCableCut || ''));
          setDelayReason(String(found.Delay_Reason__c || found.delayReason || ''));

          const rawLaser = (found.Laser_Status__c || found.laserStatus || '').trim();
          setLaserStatus(rawLaser ? rawLaser.toUpperCase() : '');
        } else {
          setError('Case not found');
        }
      } catch {
        setError('Failed to load case');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [email, caseId]);

  const handleUpdate = async () => {
    if (isReadOnly) return;
    if (!status.trim()) {
      setError('Please select a Status');
      return;
    }
    if (!rcaReason.trim()) {
      setError('Please select an RCA Reason');
      return;
    }
    if (!rcaComments.trim()) {
      setError('Please enter Resolution Comments');
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      const res = await updateCase(
        caseId,
        status,
        rcaReason,
        rcaComments,
        email,
        materialNeeded,
        material1,
        material1Quantity,
        vendorName,
        civilNeeded,
        {
          Restoration_Update_1__c: restorationUpdate1,
          Restoration_Update_1_Date_Time__c: restorationUpdate1DateTime,
          Restoration_Update_2__c: restorationUpdate2,
          Restoration_Update_2_Date_Time__c: restorationUpdate2DateTime,
          Restoration_Update_3__c: restorationUpdate3,
          Restoration_Update_3_Date_Time__c: restorationUpdate3DateTime,
          Restoration_Update_4__c: restorationUpdate4,
          Restoration_Update_4_Date_Time__c: restorationUpdate4DateTime,
          CE_Team_Acknowledgement__c: ceTeamAcknowledgement,
          Vendor_Splicer_Assigned__c: vendorSplicerAssigned,
          Splicer_Available__c: splicerAlignDateTime,
          Splicer_Acknowledgement__c: splicerAcknowledgement,
          Team_Reached_Time_Mark_On_Site__c: teamReachedTimeMarkOnSite,
          Fault_Identification__c: faultIdentification,
          Fault_Found__c: faultIdentification === 'YES' ? faultFound : '',
          Restoration_Start__c: restorationStart,
          Other_Materials__c: otherMaterials,
          Cable_Start_Reading__c: cableStartReading,
          Cable_ID__c: cableId,
          PPE_Compliance__c: ppeCompliance,
          Cable_End_Reading__c: cableEndReading,
          A_Latlong__c: aEndLatlong,
          B_Latlong__c: bEndLatlong,
          Vendor_Update_1__c: vendorUpdate1,
          Vendor_Update_1_Date_Time__c: vendorUpdate1DateTime,
          Vendor_Update_2__c: vendorUpdate2,
          Vendor_Update_2_Date_Time__c: vendorUpdate2DateTime,
          Vendor_Update_3__c: vendorUpdate3,
          Vendor_Update_3_Date_Time__c: vendorUpdate3DateTime,
          Vendor_Update_4__c: vendorUpdate4,
          Vendor_Update_4_Date_Time__c: vendorUpdate4DateTime,
          Vendor_Update_5__c: vendorUpdate5,
          Vendor_Update_5_Date_Time__c: vendorUpdate5DateTime,
          Check_The_Link_Status_Date_Time__c: checkTheLinkStatusDateTime,
          Generic_Cause_of_Cable_Cut__c: genericCauseOfCableCut,
          Delay_Reason__c: delayReason,
          Laser_Status__c: laserStatus,
          current_Status__c: currentVendorStatus,
        }
      );
      if (res.success) {
        setSuccess(status.toLowerCase() === 'resolved' ? 'The case has been resolved.' : 'Case updated successfully!');
      } else {
        setError(res.message || 'Update failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => navigate('/dashboard');
  const handleSuccessClose = () => {
    setSuccess(null);
    // When status changed to Resolved, go to Resolved tab so case appears there with read-only view
    if (status.toLowerCase() === 'resolved') {
      navigate('/dashboard?tab=resolved');
    } else {
      handleBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-600 mb-4">{error || 'Case not found'}</p>
        <button onClick={handleBack} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const caseNumber = caseData.CaseNumber ?? caseData.caseNumber ?? 'N/A';
  const currentStatus = caseData.Status ?? caseData.status ?? 'Unknown';
  const origin = caseData.Origin ?? caseData.origin ?? 'N/A';

  // LOB: Line of Business - controls which fields to show
  const lob = (caseData.Line_of_Business__c ?? caseData.LOB__c ?? caseData.lineOfBusiness ?? '').trim();
  const lobNormalized = lob.toLowerCase();

  // Helper to get field value
  const getVal = (obj, ...keys) => {
    for (const k of keys) {
      const v = obj[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return 'N/A';
  };

  // LOB-specific fields
  const siteId = getVal(caseData, 'Site_ID__c', 'siteId');
  const alarmName = getVal(caseData, 'Alarm_Name__c', 'AlarmName__c', 'alarmName');
  const circuitId = getVal(caseData, 'Circuit_ID__c', 'Circuit_Id__c', 'CircuitId__c', 'circuitId');
  const customerCircuitId = getVal(caseData, 'CustomerCircuitId__c', 'Customer_Circuit_Id__c', 'customerCircuitId');
  const consoleId = getVal(caseData, 'Console_Route_ID__c', 'Console_Id__c', 'ConsoleId__c', 'consoleId');
  const lineName = getVal(caseData, 'PathName__c', 'Line_Name__c', 'LineName__c', 'Link_Name__c', 'lineName');
  const gponId = getVal(caseData, 'GPON_ID__c', 'GPONID__c', 'gponId');
  const fatNumber = getVal(caseData, 'FAT_Number__c', 'FATNumber__c', 'fatNumber');

  const isSmallCell = lobNormalized === 'small cell';
  const isOHFC = lobNormalized === 'ohfc';
  const isFTTH = lobNormalized === 'ftth';

  const MATERIAL_NEEDED_OPTIONS = ['YES', 'NO'];
  const MATERIAL1_OPTIONS = [
    'Tiffin Box 2 WAY',
    'Tiffin Box 4 WAY',
    'Joint Closure 48F',
    'Joint Closure 96F',
    'PIGTAIL SC/APC',
    'Patch Cord',
    '12F Optical Fiber ADSS',
    '24F Optical Fiber ADSS',
    '48F Optical Fiber ADSS',
    '96F Optical Fiber ADSS',
    '12F Optical Fiber Raiser',
    '12F Optical Fiber Armoured',
    '24F Optical Fiber Raiser',
    '24F Optical Fiber Armoured',
    '48F Optical Fiber Armoured',
    '96F Optical Fiber Armoured',
    '144F Optical Fiber ADSS',
    '144F Optical Fiber Armoured',
    'Battery',
    'Fiber Cable',
    '4F ADSS Fiber',
    '6F ADSS Fiber',
  ];

  const YES_NO_OPTIONS = ['YES', 'NO'];
  const CURRENT_VENDOR_STATUS_OPTIONS = ['Access Issue', 'Closed', 'Open'];
  const GENERIC_CAUSE_OF_CABLE_CUT_OPTIONS = [
    'Access Issue',
    'CE No Issue',
    'CRQ Activity',
    'Customer End Issue',
    'Customer Own Route',
    'Disconnected',
    'FAT Related Issue',
    'FDC Related Issue',
    'Fiber Core Issue - in Aerial Fiber',
    'Fiber Core Issue - in FMS',
    'Fiber Core Issue - in Tiffin',
    'Fiber Core Issue - Pigtail Damage',
    'Fiber Cut - in Closure / Tiffin',
    'Fiber Cut - Civic Authorities',
    'Fiber Cut - Construction Work',
    'Fiber Cut - Electricity Board',
    'Fiber Cut - Festival Celebration',
    'Fiber Cut - Heavy Vehicle Movement',
    'Fiber Cut - Local People',
    'Fiber Cut - Metro Work',
    'Fiber Cut - Miscellaneous',
    'Fiber Cut - Road Crossing',
    'Fiber Cut - Street Pole Maintenance',
    'HDO Bin TT',
    'IBD Fiber Cut',
    'Invalid TT',
    'JC End Issue',
    'Low RX TT',
    'Material Use Entry',
    'New Node Inserted',
    'No Fiber Issue - ATL Issue',
    'No Fiber Issue - Patch Cord Issue',
    'No Fiber Issue - VIL Issue',
    'Node End Issue',
    'Not in HDO',
    'Not in OHFC',
    'OLT Card Issue',
    'Passive + Active',
    'Plan Activity',
    'Power Issue',
    'Project Team Working',
    'Signoff Pending',
    'Single Core Issue in Aerial',
    'Tree Cutting Drive Cut',
    'Under UG Route',
  ];

  const DELAY_REASON_OPTIONS = [
    'Access issue',
    'BMC Issue',
    'Confirmation Time Deducted',
    'Core Issue',
    'Customer Team Waiting',
    'Electricity Work Going On',
    'Heavy Bend Multiple Location',
    'Heavy Rain',
    'JCB Work Going On',
    'Local issue',
    'Market Area and Rush',
    'MBMC Issue',
    'Metro Work Going On',
    'MSEB Issue',
    'Multiple Cuts on Route',
    'NMMC Issue',
    'Partial Damage',
    'Police Issue',
    'Railway Person Issue',
    'Railway Track Crossing',
    'Rerouted',
    'Road Crossing / Heavy Traffic',
    'Route Divert',
    'TMC Issue',
    'Tree Cutting Going On',
    'Vendor - Civil Team Issue',
    'Vendor - FRB Issue',
    'Vendor - Team Busy in Other Faults',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Success</h3>
            <p className="text-slate-600 mb-6">{success}</p>
            <button
              onClick={handleSuccessClose}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <header className="bg-indigo-100 border-b border-indigo-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-indigo-200 transition tap-highlight-none"
          >
            <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-display font-bold text-indigo-900 flex-1">
            {isReadOnly ? 'Case Details' : 'Update Case Details'}
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="font-display font-bold text-indigo-600 text-lg sm:text-xl">Case #{caseNumber}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-600">
              <span className="font-medium text-slate-500">Current Status:</span> {currentStatus}
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <span className="font-medium text-slate-500">Origin:</span> {origin}
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <span className="font-medium text-slate-500">LOB:</span> {lob || 'N/A'}
            </p>

            {/* Small Cell: Site ID, Alarm Name - hidden for OHFC and FTTH */}
            {(isSmallCell || (!isOHFC && !isFTTH)) && (
              <>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">Site ID:</span> {siteId}
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">Alarm Name:</span> {alarmName}
                </p>
              </>
            )}

            {/* OHFC: Circuit Id, Customer Circuit Id, Console Id, Line Name */}
            {isOHFC && (
              <>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">Circuit Id:</span> {circuitId}
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">Customer Circuit Id:</span> {customerCircuitId}
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">Console Id:</span> {consoleId}
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">Line Name:</span> {lineName}
                </p>
              </>
            )}

            {/* FTTH: GPON ID, FAT Number */}
            {isFTTH && (
              <>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">GPON ID:</span> {gponId}
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500">FAT Number:</span> {fatNumber}
                </p>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            {isReadOnly ? 'Case RCA & Comments' : 'Update Status & RCA'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Case Status</label>
              <button
                type="button"
                onClick={() => !isReadOnly && setShowStatusSheet(true)}
                disabled={isReadOnly}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-left flex items-center justify-between tap-highlight-none disabled:opacity-70"
              >
                <span className={!status ? 'text-slate-400' : ''}>{status || 'Select status'}</span>
                {!isReadOnly && (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select RCA Reason</label>
              <button
                type="button"
                onClick={() => !isReadOnly && setShowRcaSheet(true)}
                disabled={isReadOnly}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-left flex items-center justify-between tap-highlight-none disabled:opacity-70"
              >
                <span className={`truncate ${!rcaReason ? 'text-slate-400' : ''}`}>{rcaReason || 'Select RCA reason'}</span>
                {!isReadOnly && (
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Resolution Comments</label>
              <textarea
                value={rcaComments}
                onChange={(e) => !isReadOnly && setRcaComments(e.target.value)}
                readOnly={isReadOnly}
                placeholder="Enter resolution comments..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
              />
            </div>

            <div className="pt-2">
              <h3 className="text-base font-semibold text-slate-800 mb-3">Customer Updates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 1</label>
                  <textarea
                    value={restorationUpdate1}
                    onChange={(e) => !isReadOnly && setRestorationUpdate1(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter customer update 1..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 1 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={restorationUpdate1DateTime || ''}
                    onChange={(e) => !isReadOnly && setRestorationUpdate1DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 2</label>
                  <textarea
                    value={restorationUpdate2}
                    onChange={(e) => !isReadOnly && setRestorationUpdate2(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter customer update 2..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 2 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={restorationUpdate2DateTime || ''}
                    onChange={(e) => !isReadOnly && setRestorationUpdate2DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 3</label>
                  <textarea
                    value={restorationUpdate3}
                    onChange={(e) => !isReadOnly && setRestorationUpdate3(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter customer update 3..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 3 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={restorationUpdate3DateTime || ''}
                    onChange={(e) => !isReadOnly && setRestorationUpdate3DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 4</label>
                  <textarea
                    value={restorationUpdate4}
                    onChange={(e) => !isReadOnly && setRestorationUpdate4(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter customer update 4..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Update 4 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={restorationUpdate4DateTime || ''}
                    onChange={(e) => !isReadOnly && setRestorationUpdate4DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-base font-semibold text-slate-800 mb-3">Vendor Updates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Name</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => !isReadOnly && setVendorName(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder="Enter vendor name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Status</label>
                  <select
                    value={currentVendorStatus || ''}
                    onChange={(e) => !isReadOnly && setCurrentVendorStatus(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {CURRENT_VENDOR_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Civil Needed</label>
                  <select
                    value={civilNeeded || ''}
                    onChange={(e) => !isReadOnly && setCivilNeeded(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CE Team Acknowledgement</label>
                  <input
                    type="datetime-local"
                    value={ceTeamAcknowledgement || ''}
                    onChange={(e) => !isReadOnly && setCeTeamAcknowledgement(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Splicer Assigned</label>
                  <textarea
                    value={vendorSplicerAssigned}
                    onChange={(e) => !isReadOnly && setVendorSplicerAssigned(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter vendor splicer assigned..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Splicer Align Date and Time</label>
                  <input
                    type="datetime-local"
                    value={splicerAlignDateTime || ''}
                    onChange={(e) => !isReadOnly && setSplicerAlignDateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Splicer Acknowledgement</label>
                  <input
                    type="datetime-local"
                    value={splicerAcknowledgement || ''}
                    onChange={(e) => !isReadOnly && setSplicerAcknowledgement(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Team Reached Time(Mark On Site)
                  </label>
                  <input
                    type="datetime-local"
                    value={teamReachedTimeMarkOnSite || ''}
                    onChange={(e) => !isReadOnly && setTeamReachedTimeMarkOnSite(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fault Identification</label>
                  <select
                    value={faultIdentification || ''}
                    onChange={(e) => {
                      if (isReadOnly) return;
                      const v = e.target.value;
                      setFaultIdentification(v);
                      if (v !== 'YES') setFaultFound('');
                    }}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {faultIdentification === 'YES' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fault Found</label>
                    <input
                      type="datetime-local"
                      value={faultFound || ''}
                      onChange={(e) => !isReadOnly && setFaultFound(e.target.value)}
                      readOnly={isReadOnly}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Restoration Start</label>
                  <input
                    type="datetime-local"
                    value={restorationStart || ''}
                    onChange={(e) => !isReadOnly && setRestorationStart(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Other Materials</label>
                  <textarea
                    value={otherMaterials}
                    onChange={(e) => !isReadOnly && setOtherMaterials(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter other materials..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cable Start Reading</label>
                  <textarea
                    value={cableStartReading}
                    onChange={(e) => !isReadOnly && setCableStartReading(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter cable start reading..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cable ID</label>
                  <textarea
                    value={cableId}
                    onChange={(e) => !isReadOnly && setCableId(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter cable ID..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PPE Compliance</label>
                  <select
                    value={ppeCompliance || ''}
                    onChange={(e) => !isReadOnly && setPpeCompliance(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cable End Reading</label>
                  <textarea
                    value={cableEndReading}
                    onChange={(e) => !isReadOnly && setCableEndReading(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter cable end reading..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">A End Latlong</label>
                  <input
                    type="text"
                    value={aEndLatlong}
                    onChange={(e) => !isReadOnly && setAEndLatlong(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder="Enter A end latlong"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">B End Latlong</label>
                  <input
                    type="text"
                    value={bEndLatlong}
                    onChange={(e) => !isReadOnly && setBEndLatlong(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder="Enter B end latlong"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 1</label>
                  <textarea
                    value={vendorUpdate1}
                    onChange={(e) => !isReadOnly && setVendorUpdate1(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter vendor update 1..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 1 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={vendorUpdate1DateTime || ''}
                    onChange={(e) => !isReadOnly && setVendorUpdate1DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 2</label>
                  <textarea
                    value={vendorUpdate2}
                    onChange={(e) => !isReadOnly && setVendorUpdate2(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter vendor update 2..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 2 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={vendorUpdate2DateTime || ''}
                    onChange={(e) => !isReadOnly && setVendorUpdate2DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 3</label>
                  <textarea
                    value={vendorUpdate3}
                    onChange={(e) => !isReadOnly && setVendorUpdate3(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter vendor update 3..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 3 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={vendorUpdate3DateTime || ''}
                    onChange={(e) => !isReadOnly && setVendorUpdate3DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 4</label>
                  <textarea
                    value={vendorUpdate4}
                    onChange={(e) => !isReadOnly && setVendorUpdate4(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter vendor update 4..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 4 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={vendorUpdate4DateTime || ''}
                    onChange={(e) => !isReadOnly && setVendorUpdate4DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 5</label>
                  <textarea
                    value={vendorUpdate5}
                    onChange={(e) => !isReadOnly && setVendorUpdate5(e.target.value)}
                    readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter vendor update 5..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Update 5 Date/Time</label>
                  <input
                    type="datetime-local"
                    value={vendorUpdate5DateTime || ''}
                    onChange={(e) => !isReadOnly && setVendorUpdate5DateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Check The Link Status Date/Time
                  </label>
                  <input
                    type="datetime-local"
                    value={checkTheLinkStatusDateTime || ''}
                    onChange={(e) => !isReadOnly && setCheckTheLinkStatusDateTime(e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Laser Status</label>
                  <select
                    value={laserStatus || ''}
                    onChange={(e) => !isReadOnly && setLaserStatus(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Generic Cause of Cable Cut</label>
                  <select
                    value={genericCauseOfCableCut || ''}
                    onChange={(e) => !isReadOnly && setGenericCauseOfCableCut(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {GENERIC_CAUSE_OF_CABLE_CUT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Delay Reason</label>
                  <select
                    value={delayReason || ''}
                    onChange={(e) => !isReadOnly && setDelayReason(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {DELAY_REASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Material Needed</label>
                  <select
                    value={materialNeeded || ''}
                    onChange={(e) => !isReadOnly && setMaterialNeeded(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                  >
                    <option value="">Select</option>
                    {MATERIAL_NEEDED_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {materialNeeded === 'YES' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Material 1</label>
                      <select
                        value={material1 || ''}
                        onChange={(e) => !isReadOnly && setMaterial1(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                      >
                        <option value="">Select material</option>
                        {MATERIAL1_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Material 1 Quantity (meters/nos)
                      </label>
                      <input
                        type="text"
                        value={material1Quantity}
                        onChange={(e) => !isReadOnly && setMaterial1Quantity(e.target.value)}
                        readOnly={isReadOnly}
                        placeholder="Enter quantity"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-70"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        <div className="pt-4">
          {isReadOnly ? (
            <button
              onClick={handleBack}
              className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold tap-highlight-none"
            >
              Back
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold tap-highlight-none"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold tap-highlight-none disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Status Bottom Sheet */}
      {showStatusSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStatusSheet(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4">
              <h3 className="text-lg font-bold text-slate-900">Select Status</h3>
            </div>
            <ul className="p-4 pb-8">
              {STATUS_OPTIONS.map((opt) => (
                <li key={opt}>
                  <button
                    onClick={() => { setStatus(opt); setShowStatusSheet(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-left tap-highlight-none"
                  >
                    {status === opt && (
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={status === opt ? 'font-medium text-indigo-600' : ''}>{opt}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* RCA Bottom Sheet */}
      {showRcaSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRcaSheet(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4">
              <h3 className="text-lg font-bold text-slate-900">Select RCA Reason</h3>
            </div>
            <ul className="p-4 pb-8">
              {RCA_OPTIONS.map((opt) => (
                <li key={opt}>
                  <button
                    onClick={() => { setRcaReason(opt); setShowRcaSheet(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-left tap-highlight-none"
                  >
                    {rcaReason === opt && (
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`text-sm ${rcaReason === opt ? 'font-medium text-indigo-600' : ''}`}>{opt}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
