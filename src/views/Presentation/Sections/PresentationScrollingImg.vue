<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Import images from assets
import project1 from '@/assets/img/Scrolling_Project/Project-scrolling-1.jpg'
import project2 from '@/assets/img/Scrolling_Project/Project-scrolling-2.jpg'
import project3 from '@/assets/img/Scrolling_Project/Project-scrolling-3.jpg'
import project4 from '@/assets/img/Scrolling_Project/Project-scrolling-4.jpg'
import project5 from '@/assets/img/Scrolling_Project/Project-scrolling-5.jpg'
import project6 from '@/assets/img/Scrolling_Project/Project-scrolling-6.jpg'
import project7 from '@/assets/img/Scrolling_Project/Project-scrolling-7.jpg'
import project8 from '@/assets/img/Scrolling_Project/Project-scrolling-8.jpg'
import project9 from '@/assets/img/Scrolling_Project/Project-scrolling-9.jpg'
import project10 from '@/assets/img/Scrolling_Project/Project-scrolling-10.jpg'
import project11 from '@/assets/img/Scrolling_Project/Project-scrolling-11.jpg'
import project12 from '@/assets/img/Scrolling_Project/Project-scrolling-12.jpg'
import project13 from '@/assets/img/Scrolling_Project/Project-scrolling-13.jpg'
import project14 from '@/assets/img/Scrolling_Project/Project-scrolling-14.jpg'
import project15 from '@/assets/img/Scrolling_Project/Project-scrolling-15.jpg'

const currentIndex = ref(0)
let intervalId = null

const images = [
  { url: project1 },
  { url: project2 },
  { url: project3 },
  { url: project4 },
  { url: project5 },
  { url: project6 },
  { url: project7 },
  { url: project8 },
  { url: project9 },
  { url: project10 },
  { url: project11 },
  { url: project12 },
  { url: project13 },
  { url: project14 },
  { url: project15 }
]

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % images.length
}

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + images.length) % images.length
}

const goToSlide = (index) => {
  currentIndex.value = index
}

onMounted(() => {
  intervalId = setInterval(() => {
    nextSlide()
  }, 4000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <section class="my-3 py-3">
    <div class="container">
      <div class="row">
        <div class="col-12">
          <div class="carousel-container">
            <!-- Carousel Wrapper -->
            <div class="carousel-wrapper">
              <!-- Images -->
              <div 
                v-for="(image, index) in images" 
                :key="index"
                class="carousel-slide"
                :class="{ active: index === currentIndex }"
              >
                <div class="image-overlay"></div>
                <img :src="image.url" :alt="image.title" />
                <!-- <div class="carousel-content">
                  <h2 class="carousel-title">{{ image.title }}</h2>
                  <p class="carousel-description">{{ image.description }}</p>
                </div> -->
              </div>

              <!-- Navigation Arrows -->
              <button class="carousel-arrow prev" @click="prevSlide">
                <span class="material-icons">chevron_left</span>
              </button>
              <button class="carousel-arrow next" @click="nextSlide">
                <span class="material-icons">chevron_right</span>
              </button>

              <!-- Indicators -->
              <div class="carousel-indicators">
                <button
                  v-for="(image, index) in images"
                  :key="index"
                  class="indicator"
                  :class="{ active: index === currentIndex }"
                  @click="goToSlide(index)"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #344767;
  margin-bottom: 1rem;
  position: relative;
}

.title-underline {
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 1) 0%, rgba(255, 87, 34, 1) 100%);
  margin: 0 auto;
  border-radius: 2px;
}

.carousel-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-slide.active {
  opacity: 1;
  z-index: 1;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 1;
}

.carousel-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3rem 2rem;
  z-index: 2;
  color: white;
  text-align: center;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.carousel-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.carousel-description {
  font-size: 1.2rem;
  font-weight: 400;
  margin-bottom: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.9) 0%, rgba(255, 87, 34, 0.9) 100%);
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
}

.carousel-arrow:hover {
  background: linear-gradient(135deg, rgba(255, 152, 0, 1) 0%, rgba(255, 87, 34, 1) 100%);
  box-shadow: 0 6px 20px rgba(255, 87, 34, 0.6);
  transform: translateY(-50%) scale(1.1);
}

.carousel-arrow.prev {
  left: 20px;
}

.carousel-arrow.next {
  right: 20px;
}

.carousel-arrow .material-icons {
  color: white;
  font-size: 2rem;
}

.carousel-indicators {
  position: absolute;
  bottom: 30px;
  left: 35%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 3;
  justify-content: center;
  align-items: center;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid white;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.indicator.active {
  background: linear-gradient(135deg, rgba(255, 152, 0, 1) 0%, rgba(255, 87, 34, 1) 100%);
  border-color: white;
  transform: scale(1.3);
}

/* Responsive styles */
@media (max-width: 768px) {
  .section-title {
    font-size: 1.8rem;
  }

  .carousel-wrapper {
    height: 450px;
  }

  .carousel-title {
    font-size: 1.8rem;
  }

  .carousel-description {
    font-size: 1rem;
  }

  .carousel-content {
    padding: 2rem 1rem;
  }

  .carousel-arrow {
    width: 40px;
    height: 40px;
  }

  .carousel-arrow .material-icons {
    font-size: 1.5rem;
  }

  .carousel-arrow.prev {
    left: 10px;
  }

  .carousel-arrow.next {
    right: 10px;
  }
}
</style>