<script setup>
import DefaultCounterCard from "../../../examples/cards/counterCards/DefaultCounterCard.vue";
</script>

<template>
  <section class="pt-3 pb-4" id="count-stats">
    <div class="container">
      <div class="row">
        <div class="col-lg-9 z-index-2 border-radius-xl mx-auto py-3">
          <div class="row">
            <div class="col-md-4 position-relative">
              <DefaultCounterCard
                color="success"
                title="Ground-Mounted Projects"
                description="With a proven track record of over 800 MW in ground-mounted projects across India, we have the expertise to handle any project."
                :count="800"
                suffix="MW"
                :duration="3000"
                divider="vertical"
              />
            </div>
            <div class="col-md-4 position-relative">
              <DefaultCounterCard
                color="success"
                title="Installation"
                description="We promise a quick and efficient installation process, with a 100-day promise for all our projects."
                :count="100"
                suffix="Days"
                :duration="3000"
                divider="vertical"
              />
            </div>
            <div class="col-md-4">
              <DefaultCounterCard
                color="success"
                title="Plant Service"
                description="We offer a 25-year plant service promise, ensuring your investment is protected for the long term."
                :count="25"
                suffix="Years"
                :duration="3000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
