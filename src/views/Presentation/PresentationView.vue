<script setup>
import { onMounted, onUnmounted, ref, computed, nextTick } from "vue";
import { Modal, Popover } from "bootstrap";
import Chart from 'chart.js/auto';

//example components
import NavbarDefault from "../..//examples/navbars/NavbarDefault.vue";
import DefaultFooter from "../../examples/footers/FooterDefault.vue";
import Header from "../../examples/Header.vue";

//Vue Material Kit 2 components
import MaterialSocialButton from "@/components/MaterialSocialButton.vue";

// sections
import PresentationCounter from "./Sections/PresentationCounter.vue";
import PresentationTestimonials from "./Sections/PresentationTestimonials.vue";
import PresentationInformation from "./Sections/PresentationInformation.vue";

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

// New reactive variables for enhanced table
const tableSearchQuery = ref('');
const sortColumn = ref('');
const sortDirection = ref('asc');

// Updated API call logic for WiseMelon API
async function searchExternalApi(query) {
  const baseUrl = "https://api.wisemelon.ai/api/external/collection/68c80de69e00b4024065e3aa/data";
  const apiKey = "da142bb691b1db9e0fa5596d02eaf364";
  const apiSecret = "c9dd38093a657801db2a0075afc0d949b769f576d5434aed2c8ea635ca981031";

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
    console.log("SPDCL API response:", data);

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

// Computed property to extract dynamic columns from the first result
const tableColumns = computed(() => {
  if (!results.value || results.value.length === 0) {
    return [];
  }
  
  const firstItem = results.value[0];
  return Object.keys(firstItem).map(key => ({
    key: key,
    label: formatColumnLabel(key)
  }));
});

// Enhanced table columns with better formatting
const enhancedTableColumns = computed(() => {
  if (!results.value || results.value.length === 0) {
    return [];
  }
  
  const firstItem = results.value[0];
  
  // Define the specific fields you want to display in order
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
  
  // Only include fields that exist in the data and are in our required list
  const availableColumns = requiredFields
    .filter(field => field in firstItem)
    .map(key => ({
      key: key,
      label: getFriendlyLabelForKey(key),
      sortable: true,
      searchable: true
    }));
  
  return availableColumns;
});

// Table search/filter functionality
const filteredResults = computed(() => {
  if (!tableSearchQuery.value.trim()) {
    return results.value;
  }
  
  const query = tableSearchQuery.value.toLowerCase().trim();
  
  return results.value.filter(item => {
    return Object.values(item).some(value => {
      return String(value).toLowerCase().includes(query);
    });
  });
});

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

// Utility to find a best-effort image URL field from result
function extractImageUrl(item) {
  if (!item || typeof item !== 'object') return null;
  const candidateKeys = [
    'photo', 'image', 'imageUrl', 'avatar', 'profileImage', 'picture', 'img', 'logo'
  ];
  for (const key of candidateKeys) {
    if (key in item && isUrl(String(item[key]))) return String(item[key]);
  }
  return null;
}

// preferred groups for SPDCL Data fields
const preferredGroups = [
  ['_id', 'Client Id'],
  ['Farmer Name(Applicant Name)', 'applicant_name', 'name'],
  ['Application No', 'application_no.', 'appNo'],
  ['Mobile Number', 'phone', 'contact'],
  ['Email ID', 'email'], 
  ['EMD Paid Capacity (MW)', 'LOA Issued Capacity (MW)', 'Capacity of Solar Power applied (KW)'],
  ['Location Circle', 'circle'], 
  ['Location Division', 'division'],
  ['Location Section', 'section'],
  ['Distance of proposed land and sub station (KM)', 'distance'],
  ['Location Sub Station', 'subsection'],
  ['Status']
];

// Show IDs as the user requested; exclude only image-like keys
const excludedKeys = [
  'organization_id', '__v', 'updatedAt', 'Onboard Date', 
  'Communication Address', 'Communication District', 'Communication Mandal',
  'Communication State', 'Communication Village', 'Application Type',
  'Authorized Person', 'Father/Husband Name', 'Gender', 'Image',
  'Installation Solar Power Plant', 'Land Coverage (Acres)', 'Land Survey No',
  'Location DISCOM', 'Location Sub Division', 'Net worth of the Firm',
  'Pan Number', 'Reject/pending Reason', 'Sl', 'Sl_No', 'Aadhar Number'
];
const imageCandidateKeys = ['photo','image','imageUrl','avatar','profileImage','picture','img','logo'];

function groupIndexForKey(key) {
  for (let i = 0; i < preferredGroups.length; i++) {
    if (preferredGroups[i].includes(key)) return i;
  }
  return Number.MAX_SAFE_INTEGER;
}

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
  
  // Toggle functionality - close if already open
  if (workStatusPopover && workStatusPopover._element === anchor) {
    workStatusPopover.hide();
    workStatusPopover.dispose();
    workStatusPopover = null;
    return;
  }
  
  // Close any existing work status popover before opening new one
  if (workStatusPopover) {
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  // Close other popovers if they're open (mutual exclusivity)
  if (paymentStatusPopover) {
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  
  if (reportPopover) {
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    reportPopover.dispose();
    reportPopover = null;
  }
  
  workStatusLoading.value = true;
  workStatusError.value = "";
  workStatusData.value = null;

  try {
    const item = selectedItem.value;
    if (!item) {
      throw new Error('No item selected');
    }

    // Map actual API data to work status steps
    const stepsWithStatus = workStatusSteps.map(step => {
      let completed = false;
      let date = null;

      switch (step.key) {
        case 'site_survey':
          completed = !!item['Onboard Date']; // If onboarded, survey is done
          date = completed ? new Date(item['Onboard Date']).toLocaleDateString() : null;
          break;
        case 'dpr_initiated':
          completed = !!item['Application No']; // If app exists, DPR initiated
          date = completed ? new Date(item['Onboard Date']).toLocaleDateString() : null;
          break;
        case 'dpr_submitted_redco':
        case 'dpr_redco_approval':
          completed = !!item['EMD Paid Capacity (MW)'] && item['EMD Paid Capacity (MW)'] > 0;
          date = completed ? new Date(item['updatedAt']).toLocaleDateString() : null;
          break;
        case 'dpr_submitted_bank':
        case 'loan_application':
          completed = item['Status'] === 'Active' && !!item['EMD Paid Capacity (MW)'];
          date = completed ? new Date(item['updatedAt']).toLocaleDateString() : null;
          break;
        case 'loan_milestone':
        case 'plant_design':
          completed = !!item['LOA Issued Capacity (MW)'] && item['LOA Issued Capacity (MW)'] > 0;
          date = completed ? new Date(item['updatedAt']).toLocaleDateString() : null;
          break;
        default:
          // For remaining steps, only mark complete if LOA is issued and status is Active
          completed = item['Status'] === 'Active' && 
                     !!item['LOA Issued Capacity (MW)'] && 
                     item['LOA Issued Capacity (MW)'] > 0;
          date = completed ? new Date(item['updatedAt']).toLocaleDateString() : null;
      }

      return {
        ...step,
        completed,
        date
      };
    });

    // Calculate progress based on actual completed steps
    const completedCount = stepsWithStatus.filter(s => s.completed).length;

    workStatusData.value = {
      applicationNo: item['Application No'] || 'Unknown',
      clientId: item['Client Id'] || 'Unknown',
      currentStatus: item['Status'] || 'Unknown',
      steps: stepsWithStatus,
      overallProgress: Math.round((completedCount / workStatusSteps.length) * 100),
      lastUpdated: item['updatedAt'] || new Date().toISOString()
    };

  } catch (e) {
    workStatusError.value = e?.message || 'Failed to fetch work status';
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
  }
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
          <div class="small text-muted">${data.applicationNo || 'Unknown'}</div>
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
  
  // Toggle functionality - close if already open
  if (paymentStatusPopover && paymentStatusPopover._element === anchor) {
    paymentStatusPopover.hide();
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
    return;
  }
  
  // Close any existing payment status popover before opening new one
  if (paymentStatusPopover) {
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
  }
  
  // Close other popovers if they're open (mutual exclusivity)
  if (workStatusPopover) {
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  if (reportPopover) {
    if (window.reportChart) {
      window.reportChart.destroy();
      window.reportChart = null;
    }
    reportPopover.dispose();
    reportPopover = null;
  }
  
  paymentStatusLoading.value = true;
  paymentStatusError.value = "";
  paymentStatusData.value = null;

  try {
    const item = selectedItem.value;
    if (!item) {
      throw new Error('No item selected');
    }

    // Check if we have enough data for payment status
    const capacity = parseFloat(item['Capacity of Solar Power applied (KW)']);
    const emdCapacity = parseFloat(item['EMD Paid Capacity (MW)']);
    const loaCapacity = parseFloat(item['LOA Issued Capacity (MW)']);

    if (!capacity || capacity === 0) {
      throw new Error('Payment data is not available - missing capacity information');
    }

    // Calculate payment amounts based on actual data
    const totalAmount = capacity * 50; // Assuming 50 rupees per KW
    
    // Create payment history based on actual API data
    const paymentHistory = [
      {
        id: 1,
        type: 'Advance',
        amount: totalAmount * 0.2,
        status: item['Onboard Date'] ? 'Completed' : 'Pending',
        date: item['Onboard Date'] ? new Date(item['Onboard Date']).toLocaleDateString() : null,
        reference: item['Onboard Date'] ? 'ADV001' : null,
        percentage: 20
      },
      {
        id: 2,
        type: 'EMD Payment',
        amount: emdCapacity ? emdCapacity * 1000 * 50 * 0.1 : totalAmount * 0.1,
        status: (emdCapacity && emdCapacity > 0) ? 'Completed' : 'Pending',
        date: (emdCapacity && emdCapacity > 0) ? new Date(item['updatedAt']).toLocaleDateString() : null,
        reference: (emdCapacity && emdCapacity > 0) ? 'EMD001' : null,
        percentage: 10
      },
      {
        id: 3,
        type: 'Material Procurement',
        amount: totalAmount * 0.4,
        status: (item['Status'] === 'Active' && loaCapacity > 0) ? 'Completed' : 'Pending',
        date: (item['Status'] === 'Active' && loaCapacity > 0) ? new Date(item['updatedAt']).toLocaleDateString() : null,
        reference: (item['Status'] === 'Active' && loaCapacity > 0) ? 'MAT001' : null,
        percentage: 40
      },
      {
        id: 4,
        type: 'Installation',
        amount: totalAmount * 0.2,
        status: (item['Installation Solar Power Plant'] && item['Installation Solar Power Plant'].includes('plant')) ? 'Completed' : 'Pending',
        date: (item['Installation Solar Power Plant'] && item['Installation Solar Power Plant'].includes('plant')) ? new Date(item['updatedAt']).toLocaleDateString() : null,
        reference: (item['Installation Solar Power Plant'] && item['Installation Solar Power Plant'].includes('plant')) ? 'INS001' : null,
        percentage: 20
      },
      {
        id: 5,
        type: 'Final Payment',
        amount: totalAmount * 0.1,
        status: (item['Status'] === 'Active' && loaCapacity > 0) ? 'Completed' : 'Pending',
        date: null, // Final payment typically comes later
        reference: null,
        percentage: 10
      }
    ];

    // Calculate actual paid amount based on completed payments
    const paidAmount = paymentHistory
      .filter(p => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0);

    paymentStatusData.value = {
      applicationNo: item['Application No'] || 'Unknown',
      clientId: item['Client Id'] || 'Unknown',
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      pendingAmount: totalAmount - paidAmount,
      paymentHistory: paymentHistory,
      paymentProgress: Math.round((paidAmount / totalAmount) * 100)
    };

  } catch (e) {
    paymentStatusError.value = e?.message || 'Payment data is not available';
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
  }
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
            ${payment.date ? `Paid on: ${new Date(payment.date).toLocaleDateString()}` : 'Payment pending'}
          </div>
          ${payment.reference ? `<div class="small text-muted">Ref: ${payment.reference}</div>` : ''}
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
          <div class="small text-muted">${data.applicationNo || 'Unknown'}</div>
        </div>
        <div class="text-end">
          <span class="badge bg-success px-2 py-1">
            ${data.paymentProgress || 0}% Paid
          </span>
        </div>
      </div>

      <!-- Payment Summary Cards -->
      <div class="row g-2 mb-3">
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
      </div>

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

let lastReportChartId = null;

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

  // Close other popovers if they're open (mutual exclusivity)
  if (workStatusPopover) {
    workStatusPopover.dispose();
    workStatusPopover = null;
  }
  
  if (paymentStatusPopover) {
    paymentStatusPopover.dispose();
    paymentStatusPopover = null;
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

// Enhanced cell value formatter with status styling
function getCellValueFormatted(item, column) {
  const value = getCellValue(item, column);
  
  // Add status styling for specific columns
  if (column.key.toLowerCase().includes('status') || 
      column.key.toLowerCase().includes('reject') ||
      column.key.toLowerCase().includes('pending')) {
    
    if (value && value.toLowerCase().includes('active')) {
      return `<span class="status-active">${value}</span>`;
    } else if (value && (value.toLowerCase().includes('pending') || value.toLowerCase().includes('processing'))) {
      return `<span class="status-pending">${value}</span>`;
    } else if (value && (value.toLowerCase().includes('reject') || value.toLowerCase().includes('cancel'))) {
      return `<span class="status-rejected">${value}</span>`;
    }
  }
  
  // Add email styling
  if (isEmail(value)) {
    return `<a href="mailto:${value}" class="text-decoration-none">${value}</a>`;
  }
  
  // Add URL styling
  if (isUrl(value)) {
    return `<a href="${value}" target="_blank" class="text-decoration-none" rel="noopener noreferrer">View Link</a>`;
  }
  
  return value;
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

// Helper function to check if a value is an email
function isEmail(value) {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// Helper function to truncate long text
function truncateText(text, maxLength = 100) {
  if (typeof text !== 'string') return text;
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Table sorting functionality
function sortTable(column) {
  if (sortColumn.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column.key;
    sortDirection.value = 'asc';
  }
  
  results.value.sort((a, b) => {
    let aVal = getCellValue(a, column);
    let bVal = getCellValue(b, column);
    
    // Convert to string for comparison
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    
    // Numeric comparison for numbers
    if (!isNaN(aVal) && !isNaN(bVal)) {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }
    
    let comparison = 0;
    if (aVal > bVal) {
      comparison = 1;
    } else if (aVal < bVal) {
      comparison = -1;
    }
    
    return sortDirection.value === 'desc' ? comparison * -1 : comparison;
  });
}

// View detailed information for a specific item
function viewDetails(item, index) {
  // Update the selectedItem to show this specific item in the client details section
  results.value = [item]; // This will make the selectedItem computed show this item
  
  // Scroll to the top of the modal to show the client details
  const modalBody = document.querySelector('#heroSearchModal .modal-body');
  if (modalBody) {
    modalBody.scrollTop = 0;
  }
  
  // Optional: Add a highlight effect
  setTimeout(() => {
    const clientDetailsCard = document.querySelector('#heroSearchModal .card.border.mb-4');
    if (clientDetailsCard) {
      clientDetailsCard.style.border = '2px solid #007bff';
      clientDetailsCard.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        clientDetailsCard.style.border = '';
      }, 2000);
    }
  }, 100);
}

// Export functionality
function exportToCSV() {
  if (!results.value || results.value.length === 0) return;
  
  const headers = enhancedTableColumns.value.map(col => col.label);
  const csvContent = [
    headers.join(','),
    ...results.value.map(item => 
      enhancedTableColumns.value.map(col => {
        const value = getCellValue(item, col);
        // Escape quotes and wrap in quotes if contains comma
        return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `energy_solar_data_${new Date().getTime()}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

// Print functionality
function printTable() {
  const printContent = `
    <html>
    <head>
      <title>Energy Solar Data Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { color: #344767; text-align: center; }
        .report-info { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Energy Solar Data Report</h1>
      <div class="report-info">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${results.value.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${enhancedTableColumns.value.slice(0, 8).map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${results.value.map(item => `
            <tr>
              ${enhancedTableColumns.value.slice(0, 8).map(col => `<td>${getCellValue(item, col)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

async function onHeroSearch() {
  const trimmed = heroQuery.value.trim();
  if (!trimmed) {
    // Show modal prompting the user to enter a query
    errorMessage.value = "Enter something to search...";
    results.value = [];
    hasSearched.value = false;
    isLoading.value = false;
    if (heroModal) {
      heroModal.show();
    }
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  hasSearched.value = true;
  try {
    const data = await searchExternalApi(trimmed);
    // Handle different response structures
    if (Array.isArray(data)) {
      // Check if multiple results were found
      if (data.length > 1) {
        results.value = data;
        // Show multiple results popover instead of displaying the data
        setTimeout(() => {
          showMultipleResultsPopover();
        }, 100);
        return;
      } else if (data.length === 1) {
        results.value = data;
      } else {
        results.value = [];
      }
    } else if (data && typeof data === 'object') {
      // If the response is an object, try to find array data
      const possibleArrayKeys = ['results', 'data', 'items', 'records'];
      let foundArray = null;
      
      for (const key of possibleArrayKeys) {
        if (Array.isArray(data[key])) {
          foundArray = data[key];
          break;
        }
      }
      
      if (foundArray) {
        if (foundArray.length > 1) {
          results.value = foundArray;
          // Show multiple results popover instead of displaying the data
          setTimeout(() => {
            showMultipleResultsPopover();
          }, 100);
          return;
        } else {
          results.value = foundArray;
        }
      } else if (Object.keys(data).length > 0) {
        // If no array found but object has data, wrap it in an array
        results.value = [data];
      } else {
        results.value = [];
      }
    } else {
      results.value = [];
    }
  } catch (err) {
    errorMessage.value = err?.message || "Unexpected error";
    results.value = [];
  } finally {
    isLoading.value = false;
    if (heroModal) {
      heroModal.show();
    }
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
                src="/src/assets/img/user-img.jpg" 
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
                <button type="button" class="btn btn-dark" @click="showReportPopover">View report</button>
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
  </div>
  <DefaultFooter />
</template>

<style scoped>
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