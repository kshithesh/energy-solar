<script setup>
import { ref } from 'vue';
import logoDark from "@/assets/img/Energy-Solar-Logo.png";

const isModalOpen = ref(false);
const projectImages = ref([
  {
    id: 1,
    src: "/src/assets/img/project-1.jpg",
  },
  {
    id: 2,
    src: "/src/assets/img/project-2.jpg",
  },
  {
    id: 3,
    src: "/src/assets/img/project-3.jpg",
  },
  {
    id: 4,
    src: "/src/assets/img/project-4.jpg",
  },
  {
    id: 5,
    src: "/src/assets/img/project-5.jpg", 
  }
]);

defineProps({
  brand: {
    type: Object,
    name: String,
    logo: String,
    route: "",
    default: () => ({
      name: "Energy Solar",
      logo: logoDark,
      route: "/"
    })
  },
  socials: {
    type: Array,
    icon: String,
    link: String,
    default: () => []
  },
  menus: {
    type: Array,
    name: String,
    items: {
      type: Array,
      name: String,
      href: String
    },
    default: () => [
      {
        name: "Our Team",
        items: [
          {
            name: "Ashwin Reddy",
            role: "Operations Head",
            mobileNo: "9849812447"
          },
          {
            name: "Raj Reddy",
            role: "Chief Financial Officer",
            mobileNo: "8897192974"
          },
          {
            name: "Arshad",
            role: "Appointments SPOC",
            mobileNo: "9966295529"
          },
          {
            name: "Sridhar",
            role: "REDCO Process SPOC",
            mobileNo: "7672034084"
          },
          {
            name: "Marka Abhinay",
            role: "Banking Process SPOC",
            mobileNo: "9553563073"
          },
          {
            name: "Ravi Teja",
            role: "Technical Challenges SPOC",
            mobileNo: "9390853265"
          },
          {
            name: "Anil Kumar",
            role: "Material Procurement SPOC",
            mobileNo: "9963349168"
          }
        ]
      },
      {
        name: "Services & Expertise",
        items: [
          {
            name: "End to End EPC",
            href: "#"
          },
          {
            name: "DPR's (Detailed Project Report)",
            href: "#"
          },
          {
            name: "Detailed Design and Engineering",
            href: "#"
          },
          {
            name: "Technical Due Deligence",
            href: "#"
          },
          {
            name: "Solar Plant Restoration",
            href: "#"
          },
          {
            name: "Technical Evaluation",
            href: "#"
          },
          {
            name: "Engineering, Procurement & Construction",
            href: "#"
          },
          {
            name: "Techno-Economics Viability Report",
            href: "#"
          },
          {
            name: "Project Monitoring and Consultancy",
            href: "#"
          },
          {
            name: "Feasibility Study",
            href: "#"
          },
          {
            name: "Operation and Maintenance",
            href: "#"
          },
          {
            name: "Audit; Plant Performance Optimization",
            href: "#"
          },
          {
            name: "Pre-bid Support",
            href: "#"
          },
          {
            name: "Root Cause Analysis",
            href: "#"
          }
        ]
      },
      {
        name: "Previous Project Photos",
        items: [
          { name: "Click here", action: "openModal" },
        ]
      },
      {
        name: "Project Estimates",
        items: []
      },
      {
        name: "Contact and Business Information",
        items: [
          {
            name: "Location",
            href: "https://maps.app.goo.gl/3o9dYoiif5rcJtqv7"
          },
          {
            name: "Phone",
            href: "tel:+919849812447"
          },
          {
            name: "Email",
            href: "mailto:support@energysolar.company"
          }
        ]
      }
    ]
  }
});

const openModal = () => {
  isModalOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  isModalOpen.value = false;
  document.body.style.overflow = 'auto';
};

const handleItemClick = (item) => {
  if (item.action === 'openModal') {
    openModal();
  } else if (item.href) {
    window.open(item.href, '_blank');
  }
};
</script>

<template>
  <footer class="footer pt-5 mt-5">
    <div class="container">
      <div class="row">
        <!-- Brand + Socials -->
        <div class="col-md-2 mb-4 ms-auto">
          <div>
            <a :href="brand.route">
              <img :src="brand.logo" class="mb-3 footer-logo" alt="main_logo" />
            </a>
            <h6 class="font-weight-bolder mb-4">{{ brand.name }}</h6>
          </div>
          <div>
            <ul class="d-flex flex-row ms-n3 nav">
              <li
                class="nav-item"
                v-for="{ icon, link } of socials"
                :key="link"
              >
                <a
                  class="nav-link pe-1"
                  :href="link"
                  target="_blank"
                  v-html="icon"
                >
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Menus -->
        <div
          class="col-md-2 col-sm-6 col-6 mb-4"
          v-for="{ name, items } of menus"
          :key="name"
        >
          <h6 class="text-sm">{{ name }}</h6>
          <ul class="flex-column ms-n3 nav">
            <li class="nav-item" v-for="item of items" :key="item.name">
              <button
                v-if="item.action"
                @click="handleItemClick(item)"
                class="nav-link btn btn-link p-0 text-start text-decoration-none"
                style="border: none; background: none; color: #f39c12;"
              >
                {{ item.name }}
              </button>
              <a
                v-else-if="item.href"
                class="nav-link"
                :href="item.href"
                target="_blank"
              >
                {{ item.name }}
              </a>

              <div v-else-if="item.role" class="nav-link d-flex flex-column">
                <span class="fw-bold">{{ item.name }}</span>
                <small class="text-muted">{{ item.role }}</small>
                <small class="text-muted">📞 {{ item.mobileNo }}</small>
              </div>
            </li>
          </ul>
        </div>

        <!-- Footer Bottom -->
        <div class="col-12">
          <div class="text-center">
            <p class="text-dark my-4 text-sm font-weight-normal">
              All rights reserved. Copyright ©
              {{ new Date().getFullYear() }}
              Energy Solar
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <div 
      v-if="isModalOpen" 
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            <i class="fas fa-solar-panel me-2" style="color: #000;"></i>
            Our Previous Solar Projects
          </h4>
          <button 
            @click="closeModal" 
            class="close-btn"
            aria-label="Close modal"
          >
            <span>X</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div class="image-grid">
            <div 
              v-for="image in projectImages" 
              :key="image.id"
              class="image-card"
            >
              <div class="image-container">
                <img 
                  :src="image.src" 
                  :alt="image.alt"
                  class="project-image"
                  @error="$event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4cHgiIGZpbGw9IiM2Yjc2ODciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Tb2xhciBQcm9qZWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg=='"
                />
                <div class="image-overlay">
                  <div class="image-info">
                    <h6 class="image-title">{{ image.title }}</h6>
                    <div class="view-icon">
                      <i class="fas fa-eye"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <p class="text-muted mb-0">
            <i class="fas fa-info-circle me-2"></i>
            Contact us for more details about our solar installations
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  width: 1000px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  border: 2px solid #f39c12;
}

.modal-header {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #d35400;
}

.modal-title {
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.modal-body {
  padding: 30px;
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  padding: 10px;
}

.image-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.image-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border-color: #f39c12;
}

.image-container {
  position: relative;
  overflow: hidden;
}

.project-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover .project-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.image-title {
  color: white;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.view-icon {
  background: #f39c12;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
}

.modal-footer {
  background: #f8f9fa;
  padding: 20px 30px;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95vw;
    margin: 20px;
  }
  
  .modal-header {
    padding: 15px 20px;
  }
  
  .modal-title {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .image-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .project-image {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    max-width: none;
    max-height: none;
  }
  
  .modal-body {
    max-height: calc(100vh - 140px);
  }
  
  .image-grid {
    gap: 15px;
  }
  
  .project-image {
    height: 180px;
  }
}

/* Click here button hover effect */
.nav-link.btn.btn-link {
  margin-left: 15px;
}
.nav-link.btn.btn-link:hover {
  margin-left: 15px;
  color: #e67e22 !important;
  text-decoration: underline !important;
}
</style>