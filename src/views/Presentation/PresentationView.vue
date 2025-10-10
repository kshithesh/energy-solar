<script setup>
import { onMounted, onUnmounted, ref, computed, nextTick } from "vue";
import { Modal, Popover } from "bootstrap";
import Chart from 'chart.js/auto';

//example components
import DefaultFooter from "../../examples/footers/FooterDefault.vue";
import Header from "../../examples/Header.vue";

// sections
import PresentationCounter from "./Sections/PresentationCounter.vue";
import PresentationInformation from "./Sections/PresentationInformation.vue";
import PresentationScrollingImg from "./Sections/PresentationScrollingImg.vue";

//images
import vueMkHeader from "@/assets/img/Energy-Solar-background.jpg";
import NavbarNew from "../../examples/navbars/NavbarNew.vue";

//hooks
const body = document.getElementsByTagName("body")[0];
onMounted(() => {
  body.classList.add("presentation-page");
  body.classList.add("bg-gray-200");
});
onUnmounted(() => {
  body.classList.remove("presentation-page");
  body.classList.remove("bg-gray-200");
});

const heroQuery = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const results = ref([]);
const hasSearched = ref(false);
let heroModal = null;
let workStatusPopover = null;
let paymentStatusPopover = null;
let reportPopover = null;
let multipleResultsPopover = null; // New popover for multiple results

window.downloadDocument = function(url, fileName) {
  if (!url || url === '#') return;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'document';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


// Updated API call logic for WiseMelon API
async function searchExternalApi(query) {
  const baseUrl = "https://api.wisemelon.ai/api/external/collection/68c80de69e00b4024065e3aa/data";
  const apiKey = "13ab5baef1563730525effd770dc2cf8";
  const apiSecret = "62097b5475faeb4e97e7198c48c9a5798d4aff254364969e1dfaa257258fefe3";

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("limit", "10");
    url.searchParams.set("skip", "0");

    if (query && query.trim() !== "") {
      url.searchParams.set("query", query.trim());
    }

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret
    };

    const response = await fetch(url.toString(), { method: "GET", headers });

    if (!response.ok) {
      throw new Error(`Request failed`);
    }

    const data = await response.json();

    // Handle direct array response
    if (Array.isArray(data)) {
      return data.length > 0 ? data : [];
    }

    // Handle object response with array properties
    if (data && typeof data === 'object') {
      // Check if data.data exists and handle it properly
      if ('data' in data) {
        if (Array.isArray(data.data)) {
          return data.data.length > 0 ? data.data : [];
        } else if (data.data && typeof data.data === 'object') {
          // If data.data is an object, wrap it in an array
          return [data.data];
        }
      }

      // Check other possible array keys
      const possibleArrayKeys = ["results", "items", "records", "documents"];
      for (const key of possibleArrayKeys) {
        if (Array.isArray(data[key])) {
          const foundArray = data[key];
          // Return empty array if found array is empty (triggers "no data found" state)
          return foundArray.length > 0 ? foundArray : [];
        }
      }

      // If no array found but object has data, wrap it in an array
      if (Object.keys(data).length > 0) {
        return [data];
      }
    }

    // Return empty array for all other cases (triggers "no data found" state)
    return [];
    
  } catch (error) {
    console.error("SPDCL Data API Error:", error);
    throw error; // This will trigger the error state in your component
  }
}

// Payment status
async function searchSecondApi(query) {
  const baseUrl = "https://api.wisemelon.ai/api/external/collection/68d0fca7f1f7ce71243537f1/data";
  const apiKey = "8685a85b989fa7bdebb7c55e895de55b";
  const apiSecret = "4a15e6fdadbf53ca0df2995e3f9bc6a9fcf3e3f39ce4bd44981b4f650f7f9d58";

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("limit", "10");
    url.searchParams.set("skip", "0");
    // if (query && query.trim() !== "") {
    //   url.searchParams.set("query", query.trim());
    // }
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret
    };

    const response = await fetch(url.toString(), { method: "GET", headers });
    if (!response.ok) {
      throw new Error("Second API Request failed");
    }

    const data = await response.json();

    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      if ("data" in data) {
        if (Array.isArray(data.data)) return data.data;
        else if (data.data && typeof data.data === "object") return [data.data];
      }
      const possibleArrayKeys = ["results", "items", "records", "documents"];
      for (const key of possibleArrayKeys) {
        if (Array.isArray(data[key])) return data[key];
      }
      if (Object.keys(data).length > 0) return [data];
    }
    return [];
  } catch (error) {
    console.error("Second API Error:", error);
    throw error;
  }
}

// work status
async function searchThirdApi(query) {
  const baseUrl = "https://api.wisemelon.ai/api/external/collection/68d0f72b1dc3f4a4ee9556d7/data";
  const apiKey = "2ac09287f4a7573a36b82f8be60d85b6";
  const apiSecret = "88bf2909e3bd1cf35710b5753717c34573f8a66316b927f7a78a4033601c4015";

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("limit", "10");
    url.searchParams.set("skip", "0");
    // if (query && query.trim() !== "") {
    //   url.searchParams.set("query", query.trim());
    // }

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret
    };

    const response = await fetch(url.toString(), { method: "GET", headers });
    if (!response.ok) {
      throw new Error("Third API Request failed");
    }

    const data = await response.json();

    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      if ("data" in data) {
        if (Array.isArray(data.data)) return data.data;
        else if (data.data && typeof data.data === "object") return [data.data];
      }
      const possibleArrayKeys = ["results", "items", "records", "documents"];
      for (const key of possibleArrayKeys) {
        if (Array.isArray(data[key])) return data[key];
      }
      if (Object.keys(data).length > 0) return [data];
    }
    return [];
  } catch (error) {
    console.error("Third API Error:", error);
    throw error;
  }
}

// Helper function to format column labels
function formatColumnLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim();
}

// Derive a single selected record to display as client details
const selectedItem = computed(() => {
  return Array.isArray(results.value) && results.value.length > 0
    ? results.value[0]
    : null;
});

function getFriendlyLabelForKey(key) {
  const labelMap = {
    '_id': 'ID',
    'Client Id': 'Client ID',
    'Farmer Name(Applicant Name)': 'Name',
    'Application No': 'Application Number',
    'Mobile Number': 'Phone Number',
    'Email ID': 'Email ID',
    'EMD Paid Capacity (MW)': 'EMD Capacity (MW)',
    'LOA Issued Capacity (MW)': 'LOA Capacity (MW)',
    'Capacity of Solar Power applied (KW)': 'Applied Capacity (KW)',
    'Location Circle': 'Location Circle',
    'Location Division': 'Location Division',
    'Location Section': 'Location Section',
    'Distance of proposed land and sub station (KM)': 'Distance (KM)',
    'Location Sub Station': 'Sub Station',
    'Status': 'Status'
  };
  
  return labelMap[key] || formatColumnLabel(key);
}

const detailsPairs = computed(() => {
  const item = selectedItem.value;
  if (!item || typeof item !== 'object') return [];

  // Use the same required fields array
  const requiredFields = [
  'Client Id',
  'Farmer Name(Applicant Name)',
  'Application No',
  'Mobile Number',
  'Email ID',
  'EMD Paid Capacity (MW)',
  'Location Circle',
  'Location Division',
  'Location Section',
  'Distance of proposed land and sub station (KM)',
  'Location Sub Station',
  'Status'
  ];

  // Filter to only show required fields that exist in the data
  const filteredKeys = requiredFields.filter(key => key in item);

  return filteredKeys.map(k => ({
    key: k,
    label: getFriendlyLabelForKey(k),
    value: getCellValue(item, { key: k })
  }));
});

// Work Status functionality
const workStatusLoading = ref(false);
const workStatusError = ref("");
const workStatusData = ref(null);

// Work Status Steps Definition
const workStatusSteps = [
  { id: 1, label: 'Site survey completed', key: 'site_survey' },
  { id: 2, label: 'DPR Initiated', key: 'dpr_initiated' },
  { id: 3, label: 'DPR Submitted to REDCO', key: 'dpr_submitted_redco' },
  { id: 4, label: 'DPR REDCO Approval Received', key: 'dpr_redco_approval' },
  { id: 5, label: 'DPR Submitted to Bank', key: 'dpr_submitted_bank' },
  { id: 6, label: 'Loan Application Submitted', key: 'loan_application' },
  { id: 7, label: 'Loan initial milestone received', key: 'loan_milestone' },
  { id: 8, label: 'Complete plant design', key: 'plant_design' },
  { id: 9, label: 'Initial personal invoices raised for material procurement', key: 'invoices_raised' },
  { id: 10, label: 'Preliminary civil work began', key: 'civil_work_began' },
  { id: 11, label: 'Materials received at site location', key: 'materials_received' },
  { id: 12, label: 'Civil work execution under progress', key: 'civil_work_progress' },
  { id: 13, label: 'Module Mounting Structure Erected', key: 'mounting_structure' },
  { id: 14, label: 'Solar Module and Electrical Equipment installation under way', key: 'equipment_installation' },
  { id: 15, label: 'Civil, Mechanical and Electrical installations Completed', key: 'installations_completed' },
  { id: 16, label: 'Evacuation infrastructure Carried out', key: 'evacuation_infrastructure' },
  { id: 17, label: 'Grid Synchronized', key: 'grid_synchronized' },
  { id: 18, label: 'End to end meticulous testing', key: 'testing_completed' },
  { id: 19, label: 'RMS Deployment', key: 'rms_deployment' },
  { id: 20, label: 'Final Handover to O&M team', key: 'final_handover' }
];

async function fetchWorkStatusAndShow(event) {
  const anchor = event.currentTarget;

  // Toggle popover if already open
  if (workStatusPopover && workStatusPopover._element === anchor) {
    workStatusPopover.hide();
    workStatusPopover.dispose();
    workStatusPopover = null;
    return;
  }

  // Close other popovers with proper cleanup
  if (workStatusPopover) {
    workStatusPopover.hide();
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  // Close other popovers if they're open (mutual exclusivity)
  if (paymentStatusPopover) {
    paymentStatusPopover.hide();
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  
  if (reportPopover) {
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    reportPopover.hide();
    reportPopover.dispose();
    reportPopover = null;
  }
  if (multipleResultsPopover) {
    multipleResultsPopover.hide();
    multipleResultsPopover.dispose();
    multipleResultsPopover = null;
  }

  workStatusLoading.value = true;
  workStatusError.value = "";
  workStatusData.value = null;

  try {
    if (!lastSearchClientId) throw new Error("No Client ID available from search");

    // Fetch data from third API
    const data = await searchThirdApi(); // Returns array of work status records

    // Normalize the search Client ID
    const normalizedSearchId = String(lastSearchClientId).trim().toLowerCase();

    // Filter by Client Id from last search - check multiple possible field names
    const filteredData = Array.isArray(data)
      ? data.filter(d => {
          const clientId = d['Client ID'] || d['Client Id'] || d['clientId'] || d['client_id'];
          const normalizedClientId = String(clientId || '').trim().toLowerCase();
          return normalizedClientId === normalizedSearchId;
        })
      : [];

    if (!filteredData.length) throw new Error("No work status data found for this client");

    const record = filteredData[0];
    const processedData = processWorkStatusData(record);
    workStatusData.value = processedData;

  } catch (e) {
    workStatusError.value = e?.message || "Failed to fetch work status";
  } finally {
    workStatusLoading.value = false;
    await nextTick();
    const html = buildWorkStatusPopoverHtml();
    workStatusPopover = new Popover(anchor, {
      html: true,
      content: html,
      placement: 'top',
      customClass: 'work-status-popover'
    });
    workStatusPopover.show();
    // Close popover when clicking outside
    function handleDocumentClick(e) {
      if (
        workStatusPopover &&
        !anchor.contains(e.target) &&
        !document.querySelector('.work-status-popover')?.contains(e.target)
      ) {
        workStatusPopover.hide();
        workStatusPopover.dispose();
        workStatusPopover = null;
        document.removeEventListener('click', handleDocumentClick);
      }
    }
    setTimeout(() => document.addEventListener('click', handleDocumentClick), 0);
  }
}

// Process work status data from API
function processWorkStatusData(record) {
  const stepMapping = [
    { key: 'Site Survey Completed', label: 'Site survey completed' },
    { key: 'DPR Initiated', label: 'DPR Initiated' },
    { key: 'DPR Submitted to REDCO', label: 'DPR Submitted to REDCO' },
    { key: 'DPR REDCO Approval Received', label: 'DPR REDCO Approval Received' },
    { key: 'DPR Submitted to Bank', label: 'DPR Submitted to Bank' },
    { key: 'Loan Application Submitted', label: 'Loan Application Submitted' },
    { key: 'Loan Initial Milestone Received', label: 'Loan initial milestone received' },
    { key: 'Complete Plant Design', label: 'Complete plant design' },
    { key: 'Initial PI Raised For Material Procurement', label: 'Initial personal invoices raised for material procurement' },
    { key: 'Preliminary Civil Work began', label: 'Preliminary civil work began' },
    { key: 'Materials Received At Site Location ', label: 'Materials received at site location' },
    { key: 'Civil work Execution under Progress', label: 'Civil work execution under progress' },
    { key: 'Module Mounting Structute Errected', label: 'Module Mounting Structure Erected' },
    { key: 'Solar Module And Electrical Equipment Installation Under Way', label: 'Solar Module and Electrical Equipment installation under way' },
    { key: 'Civil Machenical and Eectrical And Installations completed', label: 'Civil, Mechanical and Electrical installations Completed' },
    { key: 'Evacuation Infrastructure Carried Out', label: 'Evacuation infrastructure Carried out' },
    { key: 'Grid Synchronized', label: 'Grid Synchronized' },
    { key: 'End to End Meticulous Testing', label: 'End to end meticulous testing' },
    { key: 'RMS Deployment ', label: 'RMS Deployment' },
    { key: 'Final Handover To O&M Team', label: 'Final Handover to O&M team' }
  ];

  const steps = stepMapping.map((mapping, index) => ({
    id: index + 1,
    label: mapping.label,
    completed: record[mapping.key] === true,
    date: record[mapping.key] === true ? '' : null
  }));

  const completedSteps = steps.filter(s => s.completed).length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);

  return {
    clientId: record['Client ID'] || record['Client Id'] || 'Unknown',
    clientName: record['Client Name'] || 'Unknown',
    applicationNo: record['Application No'] || 'Unknown',
    steps: steps,
    overallProgress: overallProgress,
    lastUpdated: record.updatedAt || new Date().toISOString()
  };
}


function buildWorkStatusPopoverHtml() {
  if (workStatusLoading.value) {
    return '<div class="py-3 text-center"><div class="spinner-border spinner-border-sm text-primary"></div><div class="mt-2">Loading work status...</div></div>';
  }
  
  if (workStatusError.value) {
    return `
      <div class="text-center p-4">
        <div class="text-muted mb-3">
          <i class="material-icons" style="font-size: 48px;">info_outline</i>
        </div>
        <h6 class="text-muted">Work Status Data Not Available</h6>
        <p class="text-muted small">${workStatusError.value}</p>
      </div>
    `;
  }
  
  const data = workStatusData.value || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  
  const stepsHtml = steps.map((step, index) => {
    const icon = step.completed ? '✅' : '⏳';
    const textClass = step.completed ? 'fw-bold text-success' : 'text-muted';
    const dateInfo = step.date ? `<small class="text-muted d-block">Completed: ${step.date}</small>` : '';
    
    return `
      <div class="d-flex align-items-start mb-2 ${index < steps.length - 1 ? 'border-bottom pb-2' : ''}">
        <span class="me-2 mt-1">${icon}</span>
        <div class="flex-grow-1">
          <div class="${textClass}" style="font-size: 0.85rem;">${step.label}</div>
          ${dateInfo}
        </div>
        <small class="text-muted ms-2">${step.id}</small>
      </div>
    `;
  }).join('');

  return `
    <div style="max-width:400px; min-width:350px; max-height:650px; overflow:auto;" class="p-3 position-relative">
      <!-- Close Button -->
      <button type="button" class="btn-close position-absolute top-0 end-0 m-2" 
              onclick="closeWorkStatusPopover()" 
              style="z-index: 1000; width: 16px; height: 16px; font-size: 10px;"
              aria-label="Close"></button>
      
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 pe-4">
        <div>
          <div class="fw-bold h6 mb-1">Work Status</div>
        </div>
        <div class="text-end">
          <span class="badge bg-primary px-2 py-1">
            ${data.overallProgress || 0}% Complete
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="progress" style="height: 8px;">
          <div class="progress-bar bg-success" style="width: ${data.overallProgress || 0}%"></div>
        </div>
      </div>

      <!-- Steps Timeline -->
      <div class="mb-3">
        <div class="small fw-bold text-muted mb-2">PROJECT TIMELINE</div>
        <div class="work-timeline-container" style="max-height: 280px; overflow-y: auto; padding-right: 5px;">
          ${stepsHtml}
        </div>
      </div>

      <!-- Footer -->
      <div class="border-top pt-2 mt-2">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            Client: ${data.clientId || 'Unknown'}
          </small>
          <small class="text-muted">
            Updated: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'N/A'}
          </small>
        </div>
      </div>
    </div>
  `;
}

// Payment Status functionality
const paymentStatusLoading = ref(false);
const paymentStatusError = ref("");
const paymentStatusData = ref(null);

async function fetchPaymentStatusAndShow(event) {
  const anchor = event.currentTarget;

  // Toggle popover if already open
  if (paymentStatusPopover && paymentStatusPopover._element === anchor) {
    paymentStatusPopover.hide();
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
    return;
  }

  // Close other popovers with proper cleanup
  if (paymentStatusPopover) {
    paymentStatusPopover.hide();
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  
  // Close other popovers if they're open (mutual exclusivity)
  if (workStatusPopover) {
    workStatusPopover.hide();
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  if (reportPopover) {
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    reportPopover.hide();
    reportPopover.dispose();
    reportPopover = null;
  }
  if (multipleResultsPopover) {
    multipleResultsPopover.hide();
    multipleResultsPopover.dispose();
    multipleResultsPopover = null;
  }

  paymentStatusLoading.value = true;
  paymentStatusError.value = "";
  paymentStatusData.value = null;

  try {
    if (!lastSearchClientId) throw new Error("No Client ID available from search");

    // Fetch actual data from second API
    const data = await searchSecondApi(); // No query param needed
    
    // Normalize the search Client ID
    const normalizedSearchId = String(lastSearchClientId).trim().toLowerCase();
    
    // Filter by Client Id from last search - check multiple possible field names
    const filteredData = Array.isArray(data)
      ? data.filter(d => {
          const clientId = d['Client ID'] || d['Client Id'] || d['clientId'] || d['client_id'];
          const normalizedClientId = String(clientId || '').trim().toLowerCase();
          return normalizedClientId === normalizedSearchId;
        })
      : [];

    if (!filteredData.length) throw new Error("No payment status data found for this client");

    // Process the actual API data
    const record = filteredData[0];
    const processedData = processPaymentStatusData(record);
    paymentStatusData.value = processedData;     // Assign API response directly

  } catch (e) {
    paymentStatusError.value = e?.message || 'Failed to fetch payment status';
  } finally {
    paymentStatusLoading.value = false;
    await nextTick();
    const html = buildPaymentStatusPopoverHtml();
    paymentStatusPopover = new Popover(anchor, { 
      html: true, 
      content: html, 
      placement: 'top',
      customClass: 'payment-status-popover'
    });
    paymentStatusPopover.show();
    // Close popover when clicking outside
    function handleDocumentClick(e) {
      if (
        paymentStatusPopover &&
        !anchor.contains(e.target) &&
        !document.querySelector('.payment-status-popover')?.contains(e.target)
      ) {
        paymentStatusPopover.hide();
        paymentStatusPopover.dispose();
        paymentStatusPopover = null;
        document.removeEventListener('click', handleDocumentClick);
      }
    }
    setTimeout(() => document.addEventListener('click', handleDocumentClick), 0);
  }
}

// Process payment status data from API
function processPaymentStatusData(record) {
  
  const paymentFields = [
    { key: 'Advance Payment', label: 'Advance Payment' },
    { key: 'DPR  Payment', label: 'DPR Payment' },
    { key: '10% For Raising PO', label: '10% For Raising PO' },
    { key: 'Bank Term 1 Funds Released', label: 'Bank Term 1 Funds Released' },
    { key: 'Bank Term 2 Funds Released', label: 'Bank Term 2 Funds Released' },
    { key: 'Bank Term 3 Funds Released', label: 'Bank Term 3 Funds Released' },
    { key: 'Final Payment After Installation', label: 'Final Payment After Installation' }
  ];
  
  paymentFields.forEach(field => {
    console.log(`${field.key}:`, record[field.key], 'Parsed:', parseFloat(record[field.key]) || 0);
  });

  const paymentHistory = paymentFields.map(field => {
    // Try to find the field with exact match or trimmed match
    let rawValue = record[field.key];
    
    // If exact match fails, try to find a key that matches when trimmed
    if (rawValue === undefined) {
      const matchingKey = Object.keys(record).find(key => key.trim() === field.key.trim());
      if (matchingKey) {
        rawValue = record[matchingKey];
        console.log(`Found match: "${field.key}" -> "${matchingKey}":`, rawValue);
      }
    }
    
    const amount = (rawValue === null || rawValue === undefined || rawValue === '') ? 0 : parseFloat(rawValue);
    const finalAmount = isNaN(amount) ? 0 : amount;
    const isCompleted = finalAmount > 0;
    
    return {
      type: field.label,
      amount: amount,
      status: isCompleted ? 'Completed' : 'Pending',
      date: isCompleted ? record.updatedAt || null : null,
      reference: isCompleted ? `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
      percentage: 0 // Will be calculated below
    };
  });

  const totalAmount = parseFloat(record['Total Amount']) || paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = paymentHistory.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Calculate percentage for each payment
  paymentHistory.forEach(payment => {
    payment.percentage = totalAmount > 0 ? Math.round((payment.amount / totalAmount) * 100) : 0;
  });

  return {
    clientId: record['Client ID'] || record['Client Id'] || 'Unknown',
    clientName: record['Client Name'] || 'Unknown',
    applicationNo: record['Application No'] || 'Unknown',
    totalAmount: totalAmount,
    paidAmount: paidAmount,
    pendingAmount: pendingAmount,
    paymentProgress: paymentProgress,
    paymentHistory: paymentHistory
  };
}

function buildPaymentStatusPopoverHtml() {
  if (paymentStatusLoading.value) {
    return '<div class="py-3 text-center"><div class="spinner-border spinner-border-sm text-primary"></div><div class="mt-2">Loading payment status...</div></div>';
  }
  
  if (paymentStatusError.value) {
    return `
      <div class="text-center p-4">
        <div class="text-muted mb-3">
          <i class="material-icons" style="font-size: 48px;">info_outline</i>
        </div>
        <h6 class="text-muted">Payment Status Data Not Available</h6>
        <p class="text-muted small">${paymentStatusError.value}</p>
      </div>
    `;
  }
  
  const data = paymentStatusData.value || {};
  const payments = Array.isArray(data.paymentHistory) ? data.paymentHistory : [];
  
  const paymentsHtml = payments.map((payment) => {
    const statusColor = payment.status === 'Completed' ? '#28a745' : '#ffc107';
    const statusIcon = payment.status === 'Completed' ? '✅' : '⏳';
    
    return `
      <div class="d-flex align-items-center justify-content-between mb-3 p-2 border rounded">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center mb-1">
            <span class="me-2">${statusIcon}</span>
            <div class="fw-bold">${payment.type}</div>
            <span class="badge ms-2" style="background-color:${statusColor}; color:white; font-size:0.7rem;">
              ${payment.status}
            </span>
          </div>
          <div class="small text-muted">
            ${payment.amount ? `Paid` : 'Payment pending'}
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">₹${payment.amount.toLocaleString()}</div>
          <small class="text-muted">${payment.percentage}%</small>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="max-width:420px; min-width:380px;" class="p-3 position-relative">
      <!-- Close Button -->
      <button type="button" class="btn-close position-absolute top-0 end-0 m-2" 
              onclick="closePaymentStatusPopover()" 
              style="z-index: 1000; width: 16px; height: 16px; font-size: 10px;"
              aria-label="Close"></button>
      
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 pe-4">
        <div>
          <div class="fw-bold h6 mb-1">Payment Status</div>
        </div>
        <div class="text-end">
          
        </div>
      </div>

      <!-- Payment Summary Cards -->
      <!-- <div class="row g-2 mb-3">
        <div class="col-4">
          <div class="bg-primary bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">₹${(data.totalAmount || 0).toLocaleString()}</div>
            <small>Total</small>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-success bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">₹${(data.paidAmount || 0).toLocaleString()}</div>
            <small>Paid</small>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-warning bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">₹${(data.pendingAmount || 0).toLocaleString()}</div>
            <small>Pending</small>
          </div>
        </div>
      </div>-->

      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="progress" style="height: 8px;">
          <div class="progress-bar bg-success" style="width: ${data.paymentProgress || 0}%"></div>
        </div>
      </div>

      <!-- Payment History -->
      <div class="mb-3">
        <div class="small fw-bold text-muted mb-2">PAYMENT HISTORY</div>
        <div class="payment-history-container" style="max-height: 280px; overflow-y: auto; padding-right: 5px;">
          ${paymentsHtml}
        </div>
      </div>

      <!-- Footer -->
      <div class="border-top pt-2 mt-2">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            Client: ${data.clientId || 'Unknown'}
          </small>
          <small class="text-muted">
            Last updated: ${new Date().toLocaleDateString()}
          </small>
        </div>
      </div>
    </div>
  `;
}

// Replace the buildReportSvg() function with this updated version
function buildReportSvg() {
  const item = selectedItem.value;
  if (!item) return '<div class="p-2">No data available</div>';

  // Generate random values if missing
  if (!item.unitsGenerated) {
    item.unitsGenerated = Math.floor(Math.random() * 2000) + 1000;
  }
  if (!item.revenueGenerated) {
    item.revenueGenerated = (Math.random() * 10000).toFixed(2);
  }

  // Extract metrics
  const appliedCapacity = parseFloat(item['Capacity of Solar Power applied (KW)']) || 0;
  const landCoverage = parseFloat(item['Land Coverage (Acres)']) || 0;

  // Generate sample monthly data
  const generateMonthlyData = (item) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const unitsBase = item.unitsGenerated || 2500;
    const revenueBase = parseFloat(item.revenueGenerated) || 5000;
    
    return months.map((month, index) => {
      const seasonalFactor = 0.8 + 0.4 * Math.sin((index - 2) * Math.PI / 6);
      const randomFactor = 0.9 + 0.2 * Math.random();
      return {
        month,
        units: Math.round(unitsBase * seasonalFactor * randomFactor),
        revenue: Math.round(revenueBase * seasonalFactor * randomFactor * 100) / 100
      };
    });
  };

  const monthlyData = generateMonthlyData(item);

  // Unique chart ID
  const chartId = `lineChart_${Date.now()}`;

  // Store monthly data globally for chart initialization
  if (!window.reportChartsData) window.reportChartsData = {};
  window.reportChartsData[chartId] = monthlyData;

  // Return HTML only (no <script>)
  return `
    <div style="max-width:500px; min-width:482px;" class="p-3 position-relative">
      <!-- Close Button -->
      <button type="button" class="btn-close position-absolute top-0 end-0 m-2" 
              onclick="closeReportPopover()" 
              style="z-index: 1000; width: 16px; height: 16px; font-size: 10px;"
              aria-label="Close"></button>
      
      <div class="fw-bold mb-3 h6 text-center pe-4">
        <i class="material-icons me-1" style="font-size:18px">assessment</i>
        Project Analytics Report
      </div>
      
      <!-- Key Metrics Cards -->
      <div class="row g-2 mb-3">
        <div class="col-4">
          <div class="bg-primary bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">${appliedCapacity ? (appliedCapacity/1000).toFixed(1) : '0'}</div>
            <small>MW Applied</small>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-success bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">${landCoverage || '0'}</div>
            <small>Acres</small>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-info bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">${item['Distance of proposed land and sub station (KM)'] || '0'}</div>
            <small>KM Distance</small>
          </div>
        </div>
        <div class="col-6">
          <div class="bg-warning bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">${item.unitsGenerated || '0'}</div>
            <small>Units Gen.</small>
          </div>
        </div>
        <div class="col-6">
          <div class="bg-danger bg-gradient text-white rounded p-2 text-center">
            <div class="h6 mb-0">₹${item.revenueGenerated || '0'}</div>
            <small>Revenue</small>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="bg-light rounded p-2 mb-3" style="height: 200px;">
        <canvas id="${chartId}"></canvas>
      </div>

      <!-- Status Summary -->
      <div class="row g-2 small">
        <div class="col-6">
          <div class="text-muted">Location</div>
          <div class="fw-bold">${item['Location Sub Station'] || 'N/A'}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">Category</div>
          <div class="fw-bold">${item['Applicant Category'] || 'N/A'}</div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="border-top pt-2 mt-3">
        <p class="text-muted d-block text-center">
          <i class="material-icons me-1" style="font-size:14px">info</i>
          Generated on ${new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  `;
}

function initReportChart(chartId) {
  const ctx = document.getElementById(chartId);
  if (!ctx) {
    console.warn('Canvas not found for chart ID:', chartId);
    return;
  }

  // Destroy any existing chart on this canvas
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }

  const monthlyData = window.reportChartsData?.[chartId] || [];
  
  if (monthlyData.length === 0) {
    console.warn('No chart data available for chart ID:', chartId);
    return;
  }

  try {
    const newChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: "Units Generated",
            data: monthlyData.map(d => d.units),
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Revenue (₹)",
            data: monthlyData.map(d => d.revenue),
            borderColor: "rgba(255,99,132,1)",
            backgroundColor: "rgba(255,99,132,0.2)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Store reference for cleanup
    window.reportChart = newChart;
  } catch (error) {
    console.error('Error creating chart:', error);
  }
}

function showReportPopover(event) {
  const anchor = event.currentTarget;

  // Toggle functionality - close if already open
  if (reportPopover && reportPopover._element === anchor) {
    // Clean up chart before closing
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    reportPopover.hide();
    reportPopover.dispose();
    reportPopover = null;
    return;
  }

  // Close other popovers if they're open with proper cleanup
  if (workStatusPopover) {
    workStatusPopover.hide();
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  if (paymentStatusPopover) {
    paymentStatusPopover.hide();
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  if (multipleResultsPopover) {
    multipleResultsPopover.hide();
    multipleResultsPopover.dispose();
    multipleResultsPopover = null;
  }

  // Clean up any existing chart and popover
  if (window.reportChart) {
    window.reportChart.destroy();
    window.reportChart = null;
  }
  
  if (reportPopover) {
    reportPopover.dispose();
    reportPopover = null;
  }

  // Clear any existing chart data
  if (window.reportChartsData) {
    Object.keys(window.reportChartsData).forEach(chartId => {
      const canvas = document.getElementById(chartId);
      if (canvas) {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }
      }
    });
  }

  // Generate HTML for the popover
  const html = buildReportSvg();

  // Create new popover instance
  reportPopover = new Popover(anchor, {
    html: true,
    content: html,
    placement: "top",
    customClass: "report-popover",
    sanitize: false
  });

  // Show the popover
  reportPopover.show();

  // Initialize chart after popover is shown
  setTimeout(() => {
    const popoverEl = document.querySelector(".report-popover .popover-body");
    if (!popoverEl) return;

    const canvas = popoverEl.querySelector("canvas");
    if (!canvas) return;

    const chartId = canvas.id;
    
    // Double-check no existing chart on this canvas
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    initReportChart(chartId);
  }, 100); // Increased timeout to ensure DOM is ready
  function handleDocumentClick(e) {
    const popoverEl = document.querySelector(".report-popover");
    if (
      reportPopover &&
      !anchor.contains(e.target) &&
      !(popoverEl && popoverEl.contains(e.target))
    ) {
      if (window.reportChart) {
        window.reportChart.destroy();
        window.reportChart = null;
      }
      reportPopover.hide();
      reportPopover.dispose();
      reportPopover = null;
      document.removeEventListener('click', handleDocumentClick);
    }
  }

  setTimeout(() => {
    document.addEventListener('click', handleDocumentClick);
  }, 0);
}

// Helper function to get cell value and handle different data types
function getCellValue(item, column) {
  const value = item[column.key];
  
  if (value === null || value === undefined) {
    return "—";
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  return String(value);
}

// Helper function to check if a value is a URL
function isUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return value.startsWith('http://') || value.startsWith('https://');
  } catch {
    return false;
  }
}

// Document Viewer functionality
const documentLoading = ref(false);
const documentError = ref("");
const documentData = ref(null);
let documentPopover = null;

// Function to extract document information from the API response
function extractDocuments(item) {
  if (!item || typeof item !== 'object') return [];

  const documentFields = ['1B', 'AADHAR', 'ITR', 'LOA', 'PAN', 'PPA', 'Patta Passbook', 'Image'];
  const documents = [];

  function traverse(field, value) {
    if (Array.isArray(value)) {
      value.forEach(v => traverse(field, v));
    } else if (typeof value === 'string') {
      // It's the actual file URL
      documents.push({
        type: field,
        name: `${field} Document`,
        url: value,
        uploadDate: '',
        size: 0
      });
    } else if (typeof value === 'object' && value !== null) {
      // If object, try to find nested urls or file objects
      Object.values(value).forEach(v => traverse(field, v));
    }
  }

  documentFields.forEach(field => {
    if (item[field]) traverse(field, item[field]);
  });

  return documents;
}


function showDocumentsPopover(event) {
  const anchor = event.currentTarget;

  if (documentPopover && documentPopover._element === anchor) {
    documentPopover.hide();
    documentPopover.dispose();
    documentPopover = null;
    return;
  }

  // Close all popovers with proper cleanup
  if (documentPopover) {
    documentPopover.hide();
    documentPopover.dispose();
    documentPopover = null;
  }
  if (workStatusPopover) {
    workStatusPopover.hide();
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  if (paymentStatusPopover) {
    paymentStatusPopover.hide();
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  if (reportPopover) {
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    reportPopover.hide();
    reportPopover.dispose();
    reportPopover = null;
  }
  if (multipleResultsPopover) {
    multipleResultsPopover.hide();
    multipleResultsPopover.dispose();
    multipleResultsPopover = null;
  }

  const item = selectedItem.value;
  if (!item) return;

  documentData.value = {
    applicationNo: item['Application No'] || 'Unknown',
    clientName: item['Farmer Name(Applicant Name)'] || 'Unknown',
    documents: extractDocuments(item)
  };

  const html = buildDocumentsPopoverHtml();
  documentPopover = new Popover(anchor, {
    html: true,
    content: html,
    placement: 'top',
    customClass: 'documents-popover-wrapper'
  });

  documentPopover.show();

    anchor.addEventListener('shown.bs.popover', () => {
    const popoverEl = document.querySelector('.documents-popover');
    if (!popoverEl) return;

    popoverEl.addEventListener('click', (e) => {
      const docItem = e.target.closest('.document-item');
      if (!docItem) return;

      const docName = docItem.querySelector('.fw-bold').textContent;
      const docUrl = docItem.getAttribute('data-url');

      const requireDocument = documentData.value.documents.find(doc => doc.name === docName);

      if (requireDocument.url && requireDocument.url !== '#') {
        window.open(requireDocument.url, '_blank'); // Open in new tab
      } else {
        alert('Document URL not available!');
      }
    });
  }, { once: true });

   // Close popover when clicking outside
  function handleDocumentClick(e) {
    const popoverEl = document.querySelector('.documents-popover-wrapper');
    if (
      documentPopover &&
      !anchor.contains(e.target) &&
      !(popoverEl && popoverEl.contains(e.target))
    ) {
      documentPopover.hide();
      documentPopover.dispose();
      documentPopover = null;
      document.removeEventListener('click', handleDocumentClick);
    }
  }

  setTimeout(() => {
    document.addEventListener('click', handleDocumentClick);
  }, 0);

}


function buildDocumentsPopoverHtml() {
  if (documentLoading.value) {
    return '<div class="py-3 text-center"><div class="spinner-border spinner-border-sm text-primary"></div><div class="mt-2">Loading documents...</div></div>';
  }

  if (documentError.value) {
    return `<div class="text-center p-4">
              <div class="text-muted mb-3"><i class="material-icons" style="font-size: 48px;">folder_off</i></div>
              <h6 class="text-muted">Documents Not Available</h6>
              <p class="text-muted small">${documentError.value}</p>
            </div>`;
  }

  const data = documentData.value || {};
  const documents = data.documents || [];

  const documentsHtml = `
    <div class="documents-popover" style="max-height:400px; overflow-y:auto;">
      ${documents.map((doc) => `
        <div class="d-flex align-items-center justify-content-between p-3 border-bottom document-item cursor-pointer"
            data-url="${doc.url}"
            onclick="this.getAttribute('data-url')">
          <div class="d-flex align-items-center">
            <div class="document-icon me-3">
              <i class="material-icons" style="font-size: 28px;">${getDocumentIcon(doc.type)}</i>
            </div>
            <div>
              <div class="fw-bold">${doc.name}</div>
              <div class="small text-muted">${doc.type} • ${formatFileSize(doc.size)} • ${doc.uploadDate}</div>
            </div>
          </div>
          <div class="text-muted"><i class="material-icons">open_in_new</i></div>
        </div>
      `).join('')}
    </div>
  `;

  return `
    <div style="max-width:500px; min-width:400px;" class="position-relative">
      <button type="button" class="btn-close position-absolute top-0 end-0 m-2" onclick="closeDocumentsPopover()" aria-label="Close"></button>
      <div class="p-3 border-bottom bg-light">
        <div class="d-flex align-items-center">
          <i class="material-icons me-2" style="font-size: 20px;">folder</i>
          <div>
            <div class="fw-bold h6 mb-0">Client Documents</div>
            <div class="small text-muted">${data.applicationNo || 'Unknown'}</div>
          </div>
        </div>
      </div>
      ${documentsHtml}
      <div class="p-3 border-top bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">${documents.length} document(s) available</small>
          <small class="text-muted">Client: ${data.clientName || 'Unknown'}</small>
        </div>
      </div>
    </div>
  `;
}

function getDocumentIcon(docType) {
  const iconMap = {
    '1B': 'data_usage',
    'AADHAR': 'badge',
    'ITR': 'receipt',
    'LOA': 'assignment',
    'PAN': 'credit_card',
    'PPA': 'description',
    'Patta Passbook': 'book',
    'Image': 'image'
  };
  
  return iconMap[docType] || 'description';
}

function formatFileSize(size) {
  if (!size || size === 'N/A') return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return Math.round(size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Store the Client Id from the last search
let lastSearchClientId = null;

async function onHeroSearch() {
  const trimmed = heroQuery.value.trim();
  if (!trimmed) {
    // Show modal prompting the user to enter a query
    errorMessage.value = "Enter something to search...";
    results.value = [];
    hasSearched.value = false;
    isLoading.value = false;
    if (heroModal) heroModal.show();
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  hasSearched.value = true;
  try {
    const data = await searchExternalApi(trimmed);

    // Normalize data
    let finalResults = [];
    if (Array.isArray(data)) {
      finalResults = data;
    } else if (data && typeof data === 'object') {
      const possibleArrayKeys = ['results', 'data', 'items', 'records'];
      let foundArray = null;
      for (const key of possibleArrayKeys) {
        if (Array.isArray(data[key])) {
          foundArray = data[key];
          break;
        }
      }
      if (foundArray) finalResults = foundArray;
      else if (Object.keys(data).length > 0) finalResults = [data];
    }

    results.value = finalResults;

    // Store Client Id of the first result for Work Status filtering
    if (finalResults.length > 0) {
      lastSearchClientId = finalResults[0]['Client Id'] || finalResults[0]['Client ID'] || finalResults[0]['clientId'] || finalResults[0]['client_id'];
    } else {
      lastSearchClientId = null;
    }

    if (finalResults.length > 1) {
      setTimeout(() => showMultipleResultsPopover(), 100);
    }
  } catch (err) {
    errorMessage.value = err?.message || "Unexpected error";
    results.value = [];
    lastSearchClientId = null;
  } finally {
    isLoading.value = false;
    if (heroModal) heroModal.show();
  }
}

onMounted(() => {
  const el = document.getElementById("heroSearchModal");
  if (el) {
    heroModal = new Modal(el);
  }
  
  // Add global functions for closing popovers
  window.closeWorkStatusPopover = () => {
    if (workStatusPopover) {
      workStatusPopover.hide();
      workStatusPopover.dispose();
      workStatusPopover = null;
    }
  };
  
  window.closePaymentStatusPopover = () => {
    if (paymentStatusPopover) {
      paymentStatusPopover.hide();
      paymentStatusPopover.dispose();
      paymentStatusPopover = null;
    }
  };
  
  window.closeReportPopover = () => {
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    if (reportPopover) {
      reportPopover.hide();
      reportPopover.dispose();
      reportPopover = null;
    }
  };
  
  // Add global function for closing multiple results popover
  window.closeMultipleResultsPopover = () => {
    if (multipleResultsPopover) {
      multipleResultsPopover.hide();
      multipleResultsPopover.dispose();
      multipleResultsPopover = null;
    }
  };

  // global function for closing documents popover
  window.closeDocumentsPopover = () => {
    if (documentPopover) {
      documentPopover.hide();
      documentPopover.dispose();
      documentPopover = null;
    }
  };
});

onUnmounted(() => {
  if (heroModal) {
    heroModal.hide();
    heroModal = null;
  }
  
  // Enhanced cleanup for popovers
  if (workStatusPopover) {
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  if (paymentStatusPopover) {
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  
  if (reportPopover) {
    reportPopover.dispose();
    reportPopover = null;
  }
  
  if (multipleResultsPopover) {
    multipleResultsPopover.dispose();
    multipleResultsPopover = null;
  }
  
  // Clean up all Chart.js instances
  if (window.reportChart) {
    window.reportChart.destroy();
    window.reportChart = null;
  }
  
  // Clean up any remaining charts
  if (window.reportChartsData) {
    Object.keys(window.reportChartsData).forEach(chartId => {
      const canvas = document.getElementById(chartId);
      if (canvas) {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }
      }
    });
    window.reportChartsData = {};
  }
  if (documentPopover) {
    documentPopover.dispose();
    documentPopover = null;
  }
  
  // Clean up global functions
  delete window.downloadDocument;
  delete window.closeDocumentsPopover;
  
  // Clean up global functions
  delete window.closeWorkStatusPopover;
  delete window.closePaymentStatusPopover;
  delete window.closeReportPopover;
  delete window.closeMultipleResultsPopover;
});
</script>

<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <!-- <NavbarDefault :sticky="true" /> -->
        <NavbarNew :sticky="true" />
      </div>
    </div>
  </div>
  <Header>
    <div
      class="page-header min-vh-75"
      :style="`background-image: url(${vueMkHeader})`"
      loading="lazy"
    >
      <div class="container">
        <div class="row">
          <div class="col-lg-7 text-center mx-auto position-relative">
            <h1
              class="text-white pt-3 mt-n5 me-2"
              :style="{ display: 'inline-block ' }"
            >
              Energy Solar
            </h1>
            <p class="lead text-white px-5 mt-3" :style="{ fontWeight: '500' }">
              Future is Here
            </p>
            <div class="d-flex justify-content-center mt-4">
              <div class="bg-white shadow border-radius-lg d-flex align-items-center justify-content-center p-2" style="max-width: 860px; width: 100%;">
                <div class="flex-grow-1 pe-2">
                  <input v-model="heroQuery" @keyup.enter="onHeroSearch" type="text" class="form-control" placeholder="Type to search..." style="padding: 10px 16px"/>
                </div>
                <button type="button" class="btn btn-dark ms-2 mb-0 d-flex align-items-center justify-content-center" @click="onHeroSearch">
                  <i class="material-icons me-1" style="font-size: 18px;">search</i>
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Header>

  <!-- Search Results Modal -->
  <div class="modal fade" id="heroSearchModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h6 class="modal-title">
            Search results
          </h6>
          <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">X</button> -->
        </div>

        <div class="modal-body p-0">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status"></div>
            <p class="text-muted">Searching...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="errorMessage && hasSearched" class="text-center py-5">
            <div class="text-danger mb-3">
              <i class="material-icons" style="font-size: 48px;">error_outline</i>
            </div>
            <h5 class="text-danger">Search Error</h5>
            <p class="text-muted">{{ errorMessage }}</p>
            <button type="button" class="btn btn-outline-primary btn-sm" @click="heroQuery = ''; errorMessage = ''; hasSearched = false;">
              Try Again
            </button>
          </div>

          <!-- No Data Found State -->
          <div v-else-if="hasSearched && (!results || results.length === 0)" class="text-center py-5">
            <div class="text-muted mb-3">
              <i class="material-icons" style="font-size: 48px;">search_off</i>
            </div>
            <h5 class="text-muted">No Data Found</h5>
            <p class="text-muted">
              No records found for "{{ heroQuery }}". 
              <br>
              <small>Try searching with different keywords or check the spelling.</small>
            </p>
            <div class="mt-3">
              <!-- <button type="button" class="btn btn-outline-primary btn-sm me-2" @click="heroQuery = ''; hasSearched = false;">
                <i class="material-icons me-1" style="font-size: 16px;">refresh</i>
                New Search
              </button> -->
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="onHeroSearch">
                <i class="material-icons me-1" style="font-size: 16px;">search</i>
                Search Again
              </button>
            </div>
          </div>

          <!-- Results Found - Show Data (Only for single result) -->
          <div v-else-if="results && results.length === 1">
            <div class="custom-table-container">
              <div style="height: 150px;">
                <h1>Energy Solar Client Details</h1>
                <!-- Passport Image -->
              <img 
                :src="(results[0].Image && results[0].Image[0] && results[0].Image[0][0]) 
                        ? results[0].Image[0][0] 
                        : '/src/assets/img/user-img.jpg'" 
                alt="Client Photo" 
                class="passport-image"
              />

              </div>
              <div class="custom-table-header">
                <div class="header-item">FIELD</div>
                <div class="header-item value-header">VALUE</div>
              </div>
              <div class="custom-table-body">
                <div class="custom-table-row" v-for="pair in detailsPairs" :key="pair.key">
                  <div class="row-item">{{ pair.label }}</div>
                  <div class="row-item value-item">{{ pair.value }}</div>
                </div>
              </div>
              <div class="custom-table-actions">
                <button type="button" class="btn btn-dark" style="margin-right: 10px;" @click="fetchWorkStatusAndShow">Work Status</button>
                <button type="button" class="btn btn-dark" style="margin-right: 10px;" @click="fetchPaymentStatusAndShow">Payment Status</button>
                <button type="button" class="btn btn-dark" style="margin-right: 10px;" @click="showReportPopover">View report</button>
                <button type="button" class="btn btn-dark" @click="showDocumentsPopover">View Documents</button>
              </div>
            </div>
          </div>

          <!-- Initial State - No search performed yet -->
          <div v-else class="text-center py-5">
            <div class="text-muted mb-3">
              <i class="material-icons" style="font-size: 48px;">search</i>
            </div>
            <h5 class="text-muted">Search Energy Solar Data</h5>
            <p class="text-muted">Enter a search term to find client records and project information.</p>
            <div class="mt-3">
              <small class="text-muted">
                Search by: Application No., Client Name, Mobile Number, Location, etc.
              </small>
            </div>
          </div>
        </div>

        <div class="modal-footer justify-content-between">
          <div>
            <small class="text-muted" v-if="results.length === 1">
              Showing 1 result
            </small>
            <small class="text-muted" v-else-if="results.length > 1">
              {{ results.length }} results found - please refine your search
            </small>
          </div>
          <button type="button" class="btn btn-dark m-1" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="card card-body blur shadow-blur mx-3 mx-md-4 mt-n6">
    <PresentationCounter />
    <PresentationInformation />
    <div 
      style="
        display: flex; 
        flex-direction: column;
        justify-content: center; 
        align-items: center;
        color: #344767;
        font-weight: bold;
        font-size: 2rem;
      "    
    >
      Previous Project Images
    </div>
    <PresentationScrollingImg />
  </div>
  <DefaultFooter />
</template>

<style scoped>

/* Document Viewer Styles */
.documents-popover .popover {
  max-width: 500px !important;
  border: none;
  box-shadow: 0 15px 50px rgba(0,0,0,0.2);
  border-radius: 12px;
}

.documents-popover .popover-arrow::before {
  border-top-color: #fff;
}

.document-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.document-item:hover {
  background-color: #f8f9fa;
  transform: translateX(2px);
}

.document-icon {
  color: #6c757d;
}

/* Custom scrollbar for documents container */
.documents-container::-webkit-scrollbar {
  width: 6px;
}

.documents-container::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 6px;
}

.documents-container::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 6px;
}

.documents-container::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
.report-popover .popover-body canvas {
  max-height: 650px;
  overflow: auto;
  width: 100% !important;
  height: 180px !important;
}

.report-popover .popover {
  max-width: 420px !important;
}

.passport-image {
  position: absolute;
  top: 7px;
  right: 20px;
  width: 140px;    /* adjust size */
  height: 140px;  /* adjust size */
  object-fit: cover;
  /* border: 2px solid #333; */
  border-radius: 50%;
}

/* Enhanced Multiple Results Popover Styles */
.multiple-results-popover .popover {
  max-width: 382px !important;
  border: none;
  box-shadow: 0 12px 50px rgba(0,0,0,0.18);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.multiple-results-popover .popover-arrow::before {
  border-bottom-color: #fff;
}

.multiple-results-popover .popover-body {
  max-height: 650px;
  overflow: auto;
  padding: 0 !important;
}

/* Enhanced Table Styles */
 .custom-table-container {
    /* background-color: #2e2e34; */
    border-radius: 12px;
    /* box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); */
    overflow: hidden;
    margin: 20px;
    color: #000;
    font-family: Arial, sans-serif;
  }

  .custom-table-header {
    display: flex;
    padding: 15px 20px;
    background-color: #f0ddb4;
    /* border-bottom: 1px solid #4a4a52; */
  }

  .header-item {
    flex: 1;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.9em;
    color: #000;
  }

  .value-header {
    flex: 2; /* Adjust as needed for your specific data */
  }
  
  .custom-table-body {
    padding: 0 20px;
  }

  .custom-table-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #ffc89e;
  }

  .custom-table-row:last-child {
    border-bottom: none;
  }

  .row-item {
    flex: 1;
    font-size: 0.95em;
    color: #000;
  }

  .value-item {
    flex: 2; /* Adjust as needed */
    word-break: break-word;
  }

  .custom-table-actions {
    display: flex;
    justify-content: center;
    padding: 20px;
    border-top: 1px solid #ffc89e;
  }

  .custom-table-actions .btn {
    background-color: #ff9800;
    border-color: #ff9800;
    color: #1e1e1e;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }

.table-responsive {
  max-height: 60vh;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table {
  margin-bottom: 0;
  font-size: 0.875rem;
}

.table thead th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: #344767 !important;
  border-bottom: 2px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.table tbody tr {
  transition: all 0.2s ease;
}

.hover-row:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cell-content {
  line-height: 1.4;
  word-break: break-word;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
}

.text-break {
  word-break: break-word;
}

/* Enhanced Header Styles */
.sortable-header {
  transition: all 0.2s ease;
}

.sortable-header:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: translateY(-1px);
}

.sortable-header:active {
  transform: translateY(0);
}

/* Custom Action Buttons */
.btn-group .btn {
  border-radius: 6px;
  margin: 0 1px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-group .btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-group .btn:hover::before {
  left: 100%;
}

.btn-outline-primary:hover {
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-color: #0056b3;
  transform: translateY(-1px);
}

.btn-outline-success:hover {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  border-color: #1e7e34;
  transform: translateY(-1px);
}

.btn-outline-info:hover {
  background: linear-gradient(135deg, #17a2b8, #117a8b);
  border-color: #117a8b;
  transform: translateY(-1px);
}

/* Tablet Card Styles */
.tablet-card {
  transition: all 0.2s ease;
  border-left: 3px solid transparent !important;
}

.tablet-card:hover {
  background-color: #f8f9fa;
  border-left-color: #007bff !important;
  transform: translateX(2px);
}

/* Mobile Card Enhancements */
.mobile-card {
  transition: all 0.2s ease;
  border-left: 4px solid transparent !important;
}

.mobile-card:hover {
  background-color: #f8f9fa;
  border-left-color: #007bff !important;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mobile-card .card-title {
  font-size: 1rem;
  color: #344767;
}

.mobile-card .badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
}

/* Enhanced Card Header */
.bg-gradient-dark {
  background: linear-gradient(135deg, #344767 0%, #2c3e50 100%);
  border-radius: 8px 8px 0 0;
}

/* Search Input Enhancement */
.input-group-sm .form-control {
  font-size: 0.875rem;
  border-radius: 6px 0 0 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.input-group-sm .input-group-text {
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-left: none;
  border-radius: 0 6px 6px 0;
}

/* Status Badge Enhancements */
.status-active,
.status-pending,
.status-rejected {
  display: inline-block;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 20px;
  font-size: 0.7rem;
  padding: 0.25rem 0.75rem;
  white-space: nowrap;
}

.status-active { 
  color: #28a745; 
  background: rgba(40, 167, 69, 0.1);
}

.status-pending { 
  color: #ffc107; 
  background: rgba(255, 193, 7, 0.1);
}

.status-rejected { 
  color: #dc3545; 
  background: rgba(220, 53, 69, 0.1);
}

/* Export Button Enhancements */
.btn-light:hover {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-color: #dee2e6;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Loading Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-row {
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Custom Scrollbar */
.table-responsive::-webkit-scrollbar,
.mobile-cards::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-responsive::-webkit-scrollbar-track,
.mobile-cards::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 10px;
}

.table-responsive::-webkit-scrollbar-thumb,
.mobile-cards::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #6c757d, #495057);
  border-radius: 10px;
  border: 2px solid #f8f9fa;
}

.table-responsive::-webkit-scrollbar-thumb:hover,
.mobile-cards::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #495057, #343a40);
}

/* Animation for table rows */
.table tbody tr {
  animation: slideIn 0.3s ease forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced Popover Styles */
.work-status-popover .popover,
.payment-status-popover .popover {
  max-width: 440px !important;
  border: none;
  box-shadow: 0 15px 50px rgba(0,0,0,0.2);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.work-status-popover .popover-arrow::before,
.payment-status-popover .popover-arrow::before {
  border-top-color: #fff;
}

.report-popover .popover {
  max-width: 420px !important;
  border: none;
  box-shadow: 0 15px 50px rgba(0,0,0,0.2);
  border-radius: 12px;
}

.popover-body {
  max-height: 650px;
  overflow: auto;
  padding: 0 !important;
  position: relative !important;
}

.report-popover .popover-arrow::before {
  border-top-color: #fff;
}

/* Enhanced close button styles */
.btn-close {
  background: rgba(0, 0, 0, 0.1) !important;
  border-radius: 50% !important;
  opacity: 0.8 !important;
  transition: all 0.2s ease !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  cursor: pointer !important;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.2) !important;
  opacity: 1 !important;
  transform: scale(1.1);
}

.btn-close:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.1) !important;
  outline: none !important;
}

.btn-close:active {
  background: rgba(0, 0, 0, 0.3) !important;
  transform: scale(0.95);
}

/* Popover-specific close button adjustments */
.popover .btn-close {
  position: absolute !important;
  top: 8px !important;
  right: 8px !important;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 1050 !important;
  background-size: 14px !important;
}

/* Progress bar animations */
.progress-bar {
  transition: width 0.6s ease;
}

/* Card hover effects */
.bg-primary.bg-gradient:hover,
.bg-success.bg-gradient:hover,
.bg-info.bg-gradient:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* SVG animations */
svg rect {
  transition: opacity 0.3s ease;
}

svg rect:hover {
  opacity: 1 !important;
  filter: brightness(1.1);
}

/* Status timeline styles */
.timeline-step {
  position: relative;
  padding-left: 25px;
}

.timeline-step::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 25px;
  width: 2px;
  height: 20px;
  background: #dee2e6;
}

.timeline-step:last-child::before {
  display: none;
}

/* Accessibility Improvements */
.btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.sortable-header:focus {
  outline: 2px solid #007bff;
  outline-offset: -2px;
}

/* Responsive Adjustments */
@media (max-width: 991.98px) {
  .table-responsive {
    max-height: 400px;
  }
  
  .mobile-cards {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .table-responsive {
    max-height: 50vh;
  }
  
  .modal-xl {
    max-width: 95%;
  }
  
  .card-title {
    font-size: 0.95rem !important;
  }
  
  .btn-sm {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
  
  .material-icons {
    font-size: 16px !important;
  }
  
  .work-status-popover .popover,
  .payment-status-popover .popover,
  .report-popover .popover,
  .multiple-results-popover .popover {
    max-width: 320px !important;
  }
  
  .work-status-popover .popover,
  .payment-status-popover .popover {
    transform: translateX(-20px) !important;
  }
  
  .report-popover .popover {
    transform: translateX(-30px) !important;
  }
  
  .multiple-results-popover .popover {
    transform: translateX(-25px) !important;
  }
}

@media (max-width: 576px) {
  .mobile-card .btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.6rem;
  }
  
  .mobile-card .material-icons {
    font-size: 12px !important;
  }
  
  .card-header .row {
    flex-direction: column;
  }
  
  .input-group {
    max-width: 100% !important;
    margin-bottom: 0.5rem;
  }
}

/* Print Styles */
@media print {
  .card-header,
  .btn-group,
  .input-group,
  .mobile-cards,
  .tablet-card,
  .pagination {
    display: none !important;
  }
  
  .table {
    font-size: 0.75rem;
    page-break-inside: auto;
  }
  
  .table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  .table thead {
    display: table-header-group;
  }
}

/* Dark Mode Support (Optional) */
@media (prefers-color-scheme: dark) {
  .card {
    background-color: #2c3e50;
    border-color: #34495e;
  }
  
  .table {
    --bs-table-bg: #2c3e50;
    --bs-table-color: #ecf0f1;
  }
  
  .text-muted {
    color: #95a5a6 !important;
  }
}

/* Custom scrollbar for popovers */
.popover-body::-webkit-scrollbar {
  max-height: 650px;
  overflow: auto;
  width: 4px;
}

.popover-body::-webkit-scrollbar-track {
  max-height: 650px;
  overflow: auto;
  background: #f1f1f1;
  border-radius: 4px;
}

.popover-body::-webkit-scrollbar-thumb {
  max-height: 650px;
  overflow: auto;
  background: #888;
  border-radius: 4px;
}

.popover-body::-webkit-scrollbar-thumb:hover {
  max-height: 650px;
  overflow: auto;
  background: #555;
}

/* Custom scrollbar for work status and payment status */
.work-timeline-container::-webkit-scrollbar,
.payment-history-container::-webkit-scrollbar {
  width: 6px;
}

.work-timeline-container::-webkit-scrollbar-track,
.payment-history-container::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 6px;
}

.work-timeline-container::-webkit-scrollbar-thumb,
.payment-history-container::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 6px;
}

.work-timeline-container::-webkit-scrollbar-thumb:hover,
.payment-history-container::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* Ensure smooth scrolling */
.work-timeline-container,
.payment-history-container {
  scroll-behavior: smooth;
}
</style>