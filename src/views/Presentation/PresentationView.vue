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

// Updated API call logic for WiseMelon API
async function searchExternalApi(query) {
  // const baseUrl = "https://api.wisemelon.ai/api/external/collection/68c430cd8b068cc7af7f3960/data";
  const baseUrl = "https://e5da76a9b66f.ngrok-free.app/api/external/collection/68c430cd8b068cc7af7f3960/data";
  const apiKey = "fd5ff7862e6bdfad12b4a82f5bb61b25";
  const apiSecret = "3df7afd85a7b2a3d3f6364158bd23dcf76fae45f6c99372a61336ebd6fcc3a40";

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
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`SPDCL API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("SPDCL API response:", data);

    // Return array if response is an object
    if (Array.isArray(data)) return data;

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
  const baseUrl = "https://api.wisemelon.ai/api/external/collection/68c430cd8b068cc7af7f3960/data";
  const apiKey = "fd5ff7862e6bdfad12b4a82f5bb61b25";
  const apiSecret = "3df7afd85a7b2a3d3f6364158bd23dcf76fae45f6c99372a61336ebd6fcc3a40";
  
  statusLoading.value = true;
  statusError.value = "";
  statusData.value = null;

  try {
    const url = new URL(baseUrl);
    // Try to add an identifier if present
    const id = selectedItem.value?.sr_no || selectedItem.value?.["application_no."] || '';
    if (id) {
      const filterQuery = {
        $or: [
          { "sr_no": id },
          { "application_no.": id }
        ]
      };
      url.searchParams.set('filter', JSON.stringify(filterQuery));
    }

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret
    };

    const resp = await fetch(url.toString(), { headers });
    if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
    const data = await resp.json().catch(() => ({}));
    
    // Extract status information from SPDCL data
    const record = Array.isArray(data) ? data[0] : data;
    statusData.value = {
      currentStatus: record?.["reject/pending_reason"] || 'Processing',
      updatedAt: new Date().toISOString(),
      applicationNo: record?.["application_no."],
      capacity: record?.["capacity_of_solar_power_applied_(kw)"],
      steps: [
        { label: 'Application Submitted', done: !!record?.["application_no."] },
        { label: 'EMD Payment', done: !!record?.["emd_paid_capacity_(mw)"] },
        { label: 'LOA Issued', done: !!record?.["loa_issued_capacity_(mw)"] },
        { label: 'Installation', done: record?.["installation_solar_power_plant"] === 'Yes' }
      ]
    };
  } catch (e) {
    statusError.value = e?.message || 'Failed to fetch status';
  } finally {
    statusLoading.value = false;
    await nextTick();
    const html = buildStatusPopoverHtml();
    if (statusPopover) statusPopover.dispose();
    statusPopover = new Popover(anchor, { html: true, content: html, placement: 'top' });
    statusPopover.show();
  }
}

function buildStatusPopoverHtml() {
  if (statusLoading.value) {
    return '<div class="py-2">Loading status...</div>';
  }
  if (statusError.value) {
    return `<div class="text-danger small">${statusError.value}</div>`;
  }
  const data = statusData.value || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const stepsHtml = steps.map(s => `<li class="mb-1">${s.done ? '✅' : '⏳'} ${s.label}</li>`).join('');
  return `
    <div style="max-width:260px">
      <div class="fw-bold mb-1">Status: ${data.currentStatus || 'N/A'}</div>
      <div class="text-muted small mb-2">Updated: ${data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '-'}</div>
      <ul class="ps-3 mb-0">${stepsHtml}</ul>
    </div>
  `;
}

function showReportPopover(event) {
  const anchor = event.currentTarget;
  const html = buildReportSvg();
  if (reportPopover) reportPopover.dispose();
  reportPopover = new Popover(anchor, { html: true, content: html, placement: 'top' });
  reportPopover.show();
}

function buildReportSvg() {
  // Simple dummy bar chart
  const bars = [60, 90, 40, 75, 55];
  const barWidth = 22;
  const gap = 10;
  const height = 120;
  const svgBars = bars
    .map((v, i) => {
      const x = 20 + i * (barWidth + gap);
      const y = height - v;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${v}" fill="#344767" rx="4" />`;
    })
    .join('');

  return `
    <div style="max-width:320px">
      <div class="fw-bold mb-2">Client Report (dummy)</div>
      <svg width="300" height="${height + 20}" viewBox="0 0 300 ${height + 20}">
        <rect x="0" y="0" width="300" height="${height + 20}" fill="#f8f9fa" rx="8" />
        ${svgBars}
        <text x="20" y="${height + 15}" font-size="10" fill="#6c757d">Performance</text>
      </svg>
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
});

onUnmounted(() => {
  if (heroModal) {
    heroModal.hide();
    heroModal = null;
  }
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
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Client Details (Application-like) -->
          <div v-if="selectedItem" class="card border mb-4">
            <div class="card-body position-relative">
              <h5 class="mb-3 text-center text-uppercase">Energy solar client details</h5>
              <img
                v-if="extractImageUrl(selectedItem)"
                :src="extractImageUrl(selectedItem)"
                alt="Client photo"
                class="position-absolute top-0 end-0 m-3 border rounded"
                style="width:100px;height:120px;object-fit:cover;"
                loading="lazy"
              />

              <div class="row g-3">
                <div class="col-12 col-md-8">
                  <div class="row g-2">
                    <div v-for="pair in detailsPairs" :key="pair.key" class="col-12">
                      <div class="d-flex align-items-start">
                        <div class="fw-bold me-2" style="min-width:160px">{{ pair.label }}:</div>
                        <div class="flex-grow-1">{{ pair.value }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 mt-4">
                <button type="button" class="btn btn-dark" @click="fetchStatusAndShow">Track status</button>
                <button type="button" class="btn btn-outline-dark" @click="showReportPopover">View report</button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-4">
            <div class="spinner-border text-dark" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 mb-0">Searching...</p>
          </div>
          
          <!-- Error State -->
          <div v-if="errorMessage" class="alert d-flex align-items-center" role="alert">
            <i class="material-icons me-2">error</i>
            {{ errorMessage }}
          </div>
          
          <!-- No Results State -->
          <div v-if="!isLoading && results.length === 0 && !errorMessage && hasSearched" class="text-center py-4">
            <i class="material-icons display-4 text-muted mb-3">search_off</i>
            <h6 class="mb-1">No results found</h6>
            <p class="text-muted mb-0">Try a different keyword or check your spelling.</p>
          </div>
          
          <!-- Results Table (generic) -->
          <div v-if="results.length > 0 && tableColumns.length > 0" class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light sticky-top">
                <tr>
                  <th v-for="column in tableColumns" :key="column.key" class="text-nowrap">
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in results" :key="index">
                  <td v-for="column in tableColumns" :key="column.key" class="align-middle">
                    <!-- Handle URLs -->
                    <template v-if="isUrl(getCellValue(item, column))">
                      <a 
                        :href="getCellValue(item, column)" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="btn btn-sm btn-outline-dark"
                      >
                        <i class="material-icons me-1" style="font-size: 14px;">open_in_new</i>
                        Open
                      </a>
                    </template>
                    
                    <!-- Handle Email -->
                    <template v-else-if="isEmail(getCellValue(item, column))">
                      <a :href="`mailto:${getCellValue(item, column)}`" class="text-decoration-none">
                        <i class="material-icons me-1" style="font-size: 14px;">email</i>
                        {{ getCellValue(item, column) }}
                      </a>
                    </template>
                    
                    <!-- Handle Images -->
                    <template v-else-if="column.key.toLowerCase().includes('image') || column.key.toLowerCase().includes('img') || column.key.toLowerCase().includes('photo')">
                      <img 
                        v-if="isUrl(getCellValue(item, column))" 
                        :src="getCellValue(item, column)" 
                        :alt="column.label"
                        class="img-thumbnail"
                        style="max-width: 60px; max-height: 60px; object-fit: cover;"
                        loading="lazy"
                      />
                      <span v-else class="text-muted">{{ truncateText(getCellValue(item, column), 50) }}</span>
                    </template>
                    
                    <!-- Handle Boolean values -->
                    <template v-else-if="typeof item[column.key] === 'boolean'">
                      <span :class="item[column.key] ? 'badge bg-success' : 'badge bg-secondary'">
                        <i class="material-icons me-1" style="font-size: 12px;">
                          {{ item[column.key] ? 'check' : 'close' }}
                        </i>
                        {{ getCellValue(item, column) }}
                      </span>
                    </template>
                    
                    <!-- Handle Numbers -->
                    <template v-else-if="typeof item[column.key] === 'number'">
                      <span class="fw-medium">{{ getCellValue(item, column) }}</span>
                    </template>
                    
                    <!-- Handle Arrays -->
                    <template v-else-if="Array.isArray(item[column.key])">
                      <div class="d-flex flex-wrap gap-1">
                        <span 
                          v-for="(arrayItem, arrayIndex) in item[column.key].slice(0, 3)" 
                          :key="arrayIndex" 
                          class="badge bg-light text-dark"
                        >
                          {{ arrayItem }}
                        </span>
                        <span v-if="item[column.key].length > 3" class="badge bg-secondary">
                          +{{ item[column.key].length - 3 }} more
                        </span>
                      </div>
                    </template>
                    
                    <!-- Handle Regular Text -->
                    <template v-else>
                      <span 
                        :title="getCellValue(item, column)"
                        class="text-break"
                      >
                        {{ truncateText(getCellValue(item, column), 100) }}
                      </span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Fallback for non-tabular data -->
          <div v-else-if="results.length > 0 && tableColumns.length === 0" class="row">
            <div v-for="(item, index) in results" :key="index" class="col-12 mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">Result {{ index + 1 }}</h6>
                  <pre class="bg-light p-3 rounded small">{{ JSON.stringify(item, null, 2) }}</pre>
                </div>
              </div>
            </div>
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
.table-responsive {
  max-height: 60vh;
  overflow-y: auto;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
}

.text-break {
  word-break: break-word;
}

@media (max-width: 768px) {
  .table-responsive {
    max-height: 50vh;
  }
  
  .modal-xl {
    max-width: 95%;
  }
}
</style>