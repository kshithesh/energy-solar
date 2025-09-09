<script setup>
import RotatingCard from "../../../examples/cards/rotatingCards/RotatingCard.vue";
import RotatingCardFront from "../../../examples/cards/rotatingCards/RotatingCardFront.vue";
import RotatingCardBack from "../../../examples/cards/rotatingCards/RotatingCardBack.vue";
import DefaultInfoCard from "../../../examples/cards/infoCards/DefaultInfoCard.vue";
</script>
<template>
  <section class="my-5 py-5">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-lg-4 ms-auto me-auto p-lg-4 mt-lg-0 mt-4">
          <RotatingCard>
            <RotatingCardFront
              image="https://images.unsplash.com/photo-1569683795645-b62e50fbf103?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80"
              icon="touch_app"
              title="Lowest Pricing as USP"
              description="High-quality, reliable, and eco-friendly solutions."
            />

            <RotatingCardBack
              image="https://images.unsplash.com/photo-1498889444388-e67ea62c464b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1365&q=80"
              title="End-to-End Service"
              description="From system design to installation and maintenance, we handle everything for a seamless experience."
              :action="[
                {
                  route: '/sections/page-sections/hero-sections',
                  label: 'Learn More',
                },
              ]"
            />
          </RotatingCard>
        </div>
        <div class="col-lg-6 ms-auto">
          <div class="row justify-content-start">
            <DefaultInfoCard
              icon="content_copy"
              title="High-Quality Standards"
              description="We use top-grade panels and components from leading manufacturers to ensure durability and performance."
            />
            <DefaultInfoCard
              icon="flip_to_front"
              title="Experience & Expertise"
              description="With over 800 MW of ground-mounted projects, our skilled professionals have extensive knowledge in solar technology."
            />
          </div>
          <div class="row justify-content-start mt-5">
            <DefaultInfoCard
              class="mt-3"
              icon="price_change"
              title="Eco-Friendly Commitment"
              description="Our solutions reduce electricity costs and carbon footprints, supporting a sustainable planet."
            />
            <DefaultInfoCard
              class="mt-3"
              icon="devices"
              title="Quick Installation and Service"
              description="We promise installation within 100 days, a 25-year plant service promise, and a site visit within 24 hours."
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
