<script setup>
import { onMounted, onUnmounted, ref, computed, nextTick } from "vue";
import { Modal, Popover } from "bootstrap";

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
import vueMkHeader from "@/assets/img/solar.jpg";

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
let statusPopover = null;
let reportPopover = null;

// New reactive variables for enhanced table
const tableSearchQuery = ref('');
const sortColumn = ref('');
const sortDirection = ref('asc');

// Updated API call logic for WiseMelon API
async function searchExternalApi(query) {
  const baseUrl = "https://api.wisemelon.ai/api/external/collection/68c45b9df707ce7aa5b86933/data";
  const apiKey = "e2b5ae315681e9ce7f24b503c6eaea1d";
  const apiSecret = "6bf017cc571d036549cd2c8922587904aa54bae9d6703605e78231ece3dea57e";

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

    console.log("Making API request to:", url.toString());

    const response = await fetch(url.toString(), { method: "GET", headers });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log("SPDCL API response:", data);

    // Return array if response is an object
    if (Array.isArray(data)) return data;

    if(data.data.length > 1 ){
      return null;
    }

    const possibleArrayKeys = ["data", "results", "items", "records", "documents"];
    for (const key of possibleArrayKeys) {
      if (Array.isArray(data[key])) return data[key];
    }

    return data && Object.keys(data).length > 0 ? [data] : [];
    
  } catch (error) {
    console.error("SPDCL Data API Error:", error);
    throw error;
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
  const allColumns = Object.keys(firstItem).map(key => ({
    key: key,
    label: getFriendlyLabelForKey(key),
    sortable: true,
    searchable: true
  }));
  
  // Prioritize important columns first
  const priorityColumns = [
    'sr_no',
    'farmer_name(applicant_name)',
    'application_no.',
    'mobile_number',
    'capacity_of_solar_power_applied_(kw)',
    'location_circle',
    'applicant_category',
    'installation_solar_power_plant'
  ];
  
  const sortedColumns = [];
  
  // Add priority columns first
  priorityColumns.forEach(priorityKey => {
    const column = allColumns.find(col => col.key === priorityKey);
    if (column) {
      sortedColumns.push(column);
    }
  });
  
  // Add remaining columns
  allColumns.forEach(column => {
    if (!sortedColumns.find(col => col.key === column.key)) {
      sortedColumns.push(column);
    }
  });
  
  return sortedColumns;
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

// Updated preferred groups for SPDCL Data fields
const preferredGroups = [
  ['sr_no'],
  ['farmer_name(applicant_name)', 'applicant_name', 'name'],
  ['application_no.', 'application_no', 'appNo'],
  ['mobile_number', 'phone', 'contact'],
  ['email_id', 'email'],
  ['capacity_of_solar_power_applied_(kw)', 'capacity', 'mw'],
  ['emd_paid_capacity_(mw)', 'emd_capacity'],
  ['loa_issued_capacity_(mw)', 'loa_capacity'],
  ['location_circle', 'circle'],
  ['location_division', 'division'],
  ['location_sub_division', 'sub_division'],
  ['location_section', 'section'],
  ['distance_of_proposed_land_and_sub_station_(km)', 'distance'],
  ['communication_district', 'district'],
  ['communication_mandal', 'mandal'],
  ['communication_village', 'village'],
  ['communication_address', 'address'],
  ['applicant_category', 'category'],
  ['gender'],
  ['land_coverage_(acres)', 'land_acres'],
  ['installation_solar_power_plant', 'installation_status'],
  ['reject/pending_reason', 'status']
];

// Show IDs as the user requested; exclude only image-like keys
const excludedKeys = [];
const imageCandidateKeys = ['photo','image','imageUrl','avatar','profileImage','picture','img','logo'];

function groupIndexForKey(key) {
  for (let i = 0; i < preferredGroups.length; i++) {
    if (preferredGroups[i].includes(key)) return i;
  }
  return Number.MAX_SAFE_INTEGER;
}

function getFriendlyLabelForKey(key) {
  // Updated mapping for SPDCL Data fields
  const labelMap = {
    'sr_no': 'Sr. No.',
    'farmer_name(applicant_name)': 'Farmer Name',
    'application_no.': 'Application No.',
    'emd_paid_capacity_(mw)': 'EMD Paid Capacity (MW)',
    'loa_issued_capacity_(mw)': 'LOA Issued Capacity (MW)',
    'applicant_category': 'Category',
    'application_type': 'Application Type',
    'father/husband_name': 'Father/Husband Name',
    'mobile_number': 'Mobile Number',
    'email_id': 'Email ID',
    'communication_state': 'State',
    'communication_district': 'District',
    'communication_mandal': 'Mandal',
    'communication_village': 'Village',
    'communication_address': 'Address',
    'authorized_person': 'Authorized Person',
    'location_discom': 'DISCOM',
    'location_circle': 'Circle',
    'location_division': 'Division',
    'location_sub_division': 'Sub Division',
    'location_section': 'Section',
    'location_sub_station': 'Sub Station',
    'land_coverage_(acres)': 'Land Coverage (Acres)',
    'land_survey_no': 'Survey Number',
    'capacity_of_solar_power_applied_(kw)': 'Applied Capacity (KW)',
    'distance_of_proposed_land_and_sub_station_(km)': 'Distance to Sub Station (KM)',
    'net_worth_of_the_firm': 'Net Worth',
    'installation_solar_power_plant': 'Installation Status',
    'reject/pending_reason': 'Status/Reason'
  };
  
  return labelMap[key] || formatColumnLabel(key);
}

const detailsPairs = computed(() => {
  const item = selectedItem.value;
  if (!item || typeof item !== 'object') return [];

  const keys = Object.keys(item)
    .filter(k => !excludedKeys.includes(k))
    .filter(k => !imageCandidateKeys.includes(k));

  const orderIndex = key => groupIndexForKey(key);

  const sortedKeys = [...keys].sort((a, b) => {
    const oa = orderIndex(a);
    const ob = orderIndex(b);
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });

  return sortedKeys.map(k => ({
    key: k,
    label: getFriendlyLabelForKey(k),
    value: getCellValue(item, { key: k })
  }));
});

// Status popover data
const statusLoading = ref(false);
const statusError = ref("");
const statusData = ref(null);

// Updated status fetching function
async function fetchStatusAndShow(event) {
  const anchor = event.currentTarget;
  statusLoading.value = true;
  statusError.value = "";
  statusData.value = null;

  try {
    // Use the current selected item's status data directly
    const item = selectedItem.value;
    if (!item) {
      throw new Error('No item selected');
    }

    // Extract status information from the current data
    const trackingSteps = [
      {
        label: 'Application Submitted',
        done: !!item['Application No'],
        date: item['Onboard Date'] ? new Date(item['Onboard Date']).toLocaleDateString() : null
      },
      {
        label: 'EMD Payment Completed',
        done: !!item['EMD Paid Capacity (MW)'] && item['EMD Paid Capacity (MW)'] !== '',
        capacity: item['EMD Paid Capacity (MW)']
      },
      {
        label: 'LOA Issued',
        done: !!item['LOA Issued Capacity (MW)'] && item['LOA Issued Capacity (MW)'] !== '',
        capacity: item['LOA Issued Capacity (MW)']
      },
      {
        label: 'Installation Completed',
        done: item['Installation Solar Power Plant'] && item['Installation Solar Power Plant'].includes('plant'),
        type: item['Installation Solar Power Plant']
      }
    ];

    statusData.value = {
      currentStatus: item['Status'] || 'Processing',
      applicationNo: item['Application No'],
      clientId: item['ClientID'],
      capacity: item['Capacity of Solar Power applied (KW)'],
      updatedAt: item['updatedAt'] || new Date().toISOString(),
      pendingReason: item['Reject/pending Reason'],
      trackingStatus: item['Application Track Status'] || [],
      steps: trackingSteps,
      location: `${item['Location Sub Station']}, ${item['Location Division']}`
    };
  } catch (e) {
    statusError.value = e?.message || 'Failed to fetch status';
  } finally {
    statusLoading.value = false;
    await nextTick();
    const html = buildStatusPopoverHtml();
    if (statusPopover) statusPopover.dispose();
    statusPopover = new Popover(anchor, { 
      html: true, 
      content: html, 
      placement: 'top',
      customClass: 'status-popover'
    });
    statusPopover.show();
  }
}

function buildStatusPopoverHtml() {
  if (statusLoading.value) {
    return '<div class="py-3 text-center"><div class="spinner-border spinner-border-sm text-primary"></div><div class="mt-2">Loading status...</div></div>';
  }
  
  if (statusError.value) {
    return `<div class="text-danger small p-2"><i class="material-icons me-1" style="font-size:16px">error</i>Error: ${statusError.value}</div>`;
  }
  
  const data = statusData.value || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  
  // Calculate progress percentage
  const completedSteps = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);
  
  // Build status indicator
  const statusColor = data.currentStatus === 'Active' ? '#28a745' : 
                     data.currentStatus === 'Pending' ? '#ffc107' : 
                     data.currentStatus === 'Rejected' ? '#dc3545' : '#6c757d';
  
  const stepsHtml = steps.map((step, index) => {
    const icon = step.done ? '✅' : '⏳';
    const extraInfo = step.capacity ? ` (${step.capacity} MW)` : 
                     step.date ? ` - ${step.date}` : 
                     step.type && step.done ? ` - ${step.type}` : '';
    
    return `
      <div class="d-flex align-items-start mb-2">
        <span class="me-2">${icon}</span>
        <div class="flex-grow-1">
          <div class="${step.done ? 'fw-bold text-success' : 'text-muted'}">${step.label}</div>
          ${extraInfo ? `<small class="text-muted">${extraInfo}</small>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="max-width:350px; min-width:300px;" class="p-2 position-relative">
      <!-- Close Button -->
      <button type="button" class="btn-close position-absolute top-0 end-0 m-2" 
              onclick="closeStatusPopover()" 
              style="z-index: 1000; width: 16px; height: 16px; font-size: 10px;"
              aria-label="Close"></button>
      
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 pe-4">
        <div>
          <div class="fw-bold h6 mb-1">Application Status</div>
          <div class="small text-muted">${data.applicationNo || 'N/A'}</div>
        </div>
        <div class="text-end">
          <span class="badge px-2 py-1" style="background-color:${statusColor}; color:white;">
            ${data.currentStatus || 'Unknown'}
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <small class="text-muted">Progress</small>
          <small class="fw-bold">${progressPercent}%</small>
        </div>
        <div class="progress" style="height: 6px;">
          <div class="progress-bar bg-success" style="width: ${progressPercent}%"></div>
        </div>
      </div>

      <!-- Client Info -->
      <div class="row g-2 mb-3 small">
        <div class="col-6">
          <div class="text-muted">Client ID</div>
          <div class="fw-bold">${data.clientId || 'N/A'}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">Capacity</div>
          <div class="fw-bold">${data.capacity ? data.capacity + ' KW' : 'N/A'}</div>
        </div>
      </div>

      <!-- Steps Timeline -->
      <div class="mb-3">
        <div class="small fw-bold text-muted mb-2">APPLICATION TIMELINE</div>
        ${stepsHtml}
      </div>

      ${data.pendingReason ? `
        <div class="alert alert-warning py-2 px-3 mb-2">
          <small><strong>Note:</strong> ${data.pendingReason}</small>
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="border-top pt-2 mt-2">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            ${data.location ? `📍 ${data.location}` : ''}
          </small>
          <small class="text-muted">
            Updated: ${data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'N/A'}
          </small>
        </div>
      </div>
    </div>
  `;
}

 function showReportPopover(event) {
   const anchor = event.currentTarget;
   const html = buildReportSvg();
   if (reportPopover) reportPopover.dispose();
   reportPopover = new Popover(anchor, { 
     html: true, 
     content: html, 
     placement: 'top',
     customClass: 'report-popover'
   });
   reportPopover.show();
 }

function buildReportSvg() {
  const item = selectedItem.value;
  if (!item) return '<div class="p-2">No data available</div>';

  // Extract meaningful data for the report
  const appliedCapacity = parseFloat(item['Capacity of Solar Power applied (KW)']) || 0;
  const emdCapacity = parseFloat(item['EMD Paid Capacity (MW)']) || 0;
  const loaCapacity = parseFloat(item['LOA Issued Capacity (MW)']) || 0;
  const landCoverage = parseFloat(item['Land Coverage (Acres)']) || 0;
  
  // Convert MW to KW for consistency
  const emdCapacityKW = emdCapacity * 1000;
  const loaCapacityKW = loaCapacity * 1000;
  
  // Calculate progress percentages
  const maxCapacity = Math.max(appliedCapacity, emdCapacityKW, loaCapacityKW, 1000);
  const appliedPercent = (appliedCapacity / maxCapacity) * 100;
  const emdPercent = (emdCapacityKW / maxCapacity) * 100;
  const loaPercent = (loaCapacityKW / maxCapacity) * 100;
  
  // Chart dimensions
  const chartWidth = 300;
  const chartHeight = 200;
  const barWidth = 45;
  const barSpacing = 15;
  const startX = 30;
  const maxBarHeight = 140;

  // Create bars data
  const bars = [
    { label: 'Applied', value: appliedCapacity, percent: appliedPercent, color: '#344767' },
    { label: 'EMD Paid', value: emdCapacityKW, percent: emdPercent, color: '#f39c12' },
    { label: 'LOA Issued', value: loaCapacityKW, percent: loaPercent, color: '#27ae60' }
  ];

  const barsHtml = bars.map((bar, index) => {
    const x = startX + index * (barWidth + barSpacing);
    const barHeight = (bar.percent / 100) * maxBarHeight;
    const y = chartHeight - 40 - barHeight; // 40px for bottom margin
    
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
            fill="${bar.color}" rx="4" opacity="0.8"/>
      <text x="${x + barWidth/2}" y="${chartHeight - 20}" 
            text-anchor="middle" font-size="10" fill="#666">${bar.label}</text>
      <text x="${x + barWidth/2}" y="${y - 8}" 
            text-anchor="middle" font-size="9" fill="#333" font-weight="bold">
            ${bar.value > 0 ? (bar.value >= 1000 ? (bar.value/1000).toFixed(1) + 'MW' : bar.value + 'KW') : '0'}
      </text>
    `;
  }).join('');

  // Pie chart for land usage (simple representation)
  const pieRadius = 35;
  const pieCenterX = chartWidth - 70;
  const pieCenterY = 60;
  const usedLand = landCoverage;
  const totalLand = landCoverage * 1.5; // Assume total available is 1.5x used
  const usedAngle = (usedLand / totalLand) * 360;
  
  const pieSlice = usedAngle > 0 ? `
    <path d="M ${pieCenterX} ${pieCenterY} L ${pieCenterX + pieRadius} ${pieCenterY} 
             A ${pieRadius} ${pieRadius} 0 ${usedAngle > 180 ? 1 : 0} 1 
             ${pieCenterX + pieRadius * Math.cos(usedAngle * Math.PI / 180)} 
             ${pieCenterY + pieRadius * Math.sin(usedAngle * Math.PI / 180)} Z"
          fill="#e74c3c" opacity="0.7"/>
  ` : '';

  return `
    <div style="max-width:380px; min-width:350px;" class="p-3 position-relative">
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
        <div class="col-3">
            <div class="bg-warning bg-gradient text-white rounded p-2 text-center">
                <div class="h6 mb-0">${item.unitsGenerated || '0'}</div>
                <small>Units Gen.</small>
            </div>
        </div>
        <div class="col-3">
            <div class="bg-danger bg-gradient text-white rounded p-2 text-center">
                <div class="h6 mb-0">$${item.revenueGenerated || '0'}</div>
                <small>Revenue</small>
            </div>
        </div>
      </div>

      <!-- Charts Container -->
      <div class="bg-light rounded p-2 mb-3">
        <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
          <!-- Grid lines -->
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="${chartWidth}" height="${chartHeight}" fill="url(#grid)" />
          
          <!-- Title -->
          <text x="${chartWidth/2}" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">
            Capacity Analysis (KW/MW)
          </text>
          
          <!-- Bar Chart -->
          ${barsHtml}
          
          <!-- Pie Chart for Land Usage -->
          <text x="${pieCenterX}" y="30" text-anchor="middle" font-size="10" fill="#666">Land Usage</text>
          <circle cx="${pieCenterX}" cy="${pieCenterY}" r="${pieRadius}" fill="#ecf0f1"/>
          ${pieSlice}
          <circle cx="${pieCenterX}" cy="${pieCenterY}" r="15" fill="white"/>
          <text x="${pieCenterX}" y="${pieCenterY + 3}" text-anchor="middle" font-size="8" fill="#333">
            ${usedLand.toFixed(1)}
          </text>
          <text x="${pieCenterX}" y="${pieCenterY + 12}" text-anchor="middle" font-size="6" fill="#666">
            acres
          </text>
        </svg>
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
        <small class="text-muted d-block text-center">
          <i class="material-icons me-1" style="font-size:14px">info</i>
          Generated on ${new Date().toLocaleDateString()}
        </small>
      </div>
    </div>
  `;
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

// Track status for a specific item
function trackStatus(item) {
  // Set this item as selected and trigger status tracking
  results.value = [item];
  
  // Create a mock event object for the existing fetchStatusAndShow function
  const mockEvent = {
    currentTarget: document.querySelector('.btn[title="Track Status"]') || document.body
  };
  
  fetchStatusAndShow(mockEvent);
}

// View report for a specific item
function viewReport(item) {
  if (!item.unitsGenerated) {
    item.unitsGenerated = Math.floor(Math.random() * 5000) + 1000; // Random number between 1000 and 6000
}

// Check if revenue generated data exists, if not, create random data
if (!item.revenueGenerated) {
    item.revenueGenerated = (Math.random() * 100000).toFixed(2); // Random number up to 100,000 with 2 decimal places
}

// Now call the popover function with the updated item
const mockEvent = {
    currentTarget: document.querySelector('.btn[title="View Report"]') || document.body
};
showReportPopover(mockEvent, item);
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
      results.value = data;
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
        results.value = foundArray;
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
  window.closeStatusPopover = () => {
    if (statusPopover) {
      statusPopover.hide();
      statusPopover.dispose();
      statusPopover = null;
    }
  };
  
  window.closeReportPopover = () => {
    if (reportPopover) {
      reportPopover.hide();
      reportPopover.dispose();
      reportPopover = null;
    }
  };
});

onUnmounted(() => {
  if (heroModal) {
    heroModal.hide();
    heroModal = null;
  }
  
  // Clean up popovers
  if (statusPopover) {
    statusPopover.dispose();
    statusPopover = null;
  }
  
  if (reportPopover) {
    reportPopover.dispose();
    reportPopover = null;
  }
  
  // Clean up global functions
  delete window.closeStatusPopover;
  delete window.closeReportPopover;
});
</script>

<template>
  <div class="container position-sticky z-index-sticky top-0">
    <div class="row">
      <div class="col-12">
        <NavbarDefault :sticky="true" />
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
            <span v-if="results.length > 0" class="badge bg-dark ms-2">{{ results.length }} {{ results.length === 1 ? 'result' : 'results' }}</span>
          </h6>
          <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">X</button> -->
        </div>
        <div class="custom-table-container">
          <div>
            <h1>Energy Solar Client Details</h1>
          </div>
             <!-- Passport Image -->
              <img 
                src="your-passport-image.jpg" 
                alt="Client Photo" 
                class="passport-image"
              />
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
            <button type="button" class="btn btn-dark" style="margin-right: 10px;" @click="fetchStatusAndShow">Track status</button>
            <button type="button" class="btn btn-dark" @click="showReportPopover">View report</button>
          </div>
        </div>
        <div class="modal-footer justify-content-between">
          <div>
            <small class="text-muted" v-if="results.length > 0">
              Showing {{ results.length }} {{ results.length === 1 ? 'result' : 'results' }}
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

.passport-image {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 80px;    /* adjust size */
  height: 100px;  /* adjust size */
  object-fit: cover;
  border: 2px solid #333;
  border-radius: 4px;
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
.status-popover .popover {
  max-width: 400px !important;
  border: none;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  border-radius: 12px;
}

.report-popover .popover {
  max-width: 420px !important;
  border: none;
  box-shadow: 0 15px 50px rgba(0,0,0,0.2);
  border-radius: 12px;
}

.popover-body {
  padding: 0 !important;
  position: relative !important;
}

.status-popover .popover-arrow::before {
  border-top-color: #fff;
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
  
  .status-popover .popover,
  .report-popover .popover {
    max-width: 320px !important;
  }
  
  .status-popover .popover {
    transform: translateX(-20px) !important;
  }
  
  .report-popover .popover {
    transform: translateX(-30px) !important;
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
  width: 4px;
}

.popover-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.popover-body::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.popover-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>