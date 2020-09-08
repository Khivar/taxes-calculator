<template>
  <div class="tax-details">
    <div class="graph">
      <div class="overlay" :style="{height: overlayHeight}"></div>
      <div class="step step-5">
        <div class="step-pourcentage">45%</div>
        <div class="step-tax">
            {{ bracketsFormatted[4][0] }}
            <sup>{{ bracketsFormatted[4][1] }}</sup>
        </div>
      </div>
      <div class="step step-4">
        <div class="step-price-max"><b>157 806€</b></div>
        <div class="step-pourcentage">41%</div>
        <div class="step-tax">
            {{ bracketsFormatted[3][0] }}
            <sup>{{ bracketsFormatted[3][1] }}</sup>
        </div>
      </div>
      <div class="step step-3">
        <div class="step-price-max"><b>73 369€</b></div>
        <div class="step-pourcentage">30%</div>
        <div class="step-tax">{{ bracketsFormatted[2][0] }}
          <sup>{{ bracketsFormatted[2][1] }}</sup>
        </div>
      </div>
      <div class="step step-2">
        <div class="step-price-max"><b>25 659€</b></div>
        <div class="step-pourcentage">11%</div>
        <div class="step-tax">{{ bracketsFormatted[1][0] }}
          <sup>{{ bracketsFormatted[1][1] }}</sup>
        </div>
      </div>
      <div class="step step-1">
        <div class="step-price-max"><b>10 064€</b></div>
        <div class="step-pourcentage">0%</div>
        <div class="step-tax">0€
          <sup>00</sup>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'tax-graphic',
  props: {
    brackets: Array,
  },
  computed: {
    bracketsFormatted() {
      return [...this.brackets, ...new Array(5 - this.brackets.length).fill(0)].map((b) => {
        const parts = b.toString().split('.');
        return [this.$root.$options.filters.formatEuros(parts[0]), parts.length > 1
          ? parts[1].substr(0, 2).padEnd(2, '0') : '00'];
      });
    },
    overlayHeight() {
      return `${100 - this.brackets.length * 20}%`;
    },
  },
};
</script>

<style scoped lang="scss">
.tax-details{
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: center;
  align-items: stretch;
  position: relative;

  @media screen and (max-width: 800px) {
    margin: 15px 0 0;
    max-width: 100%;
  }
}

.overlay{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background-color: #fff;
  z-index: 2;
  transition: all ease 0.5s;

  @media screen and (max-width: 800px) {
   background-color: rgba(0,0,0,0.8);
  }
}

.graph{
    position: relative;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
}

.step{
  flex: 1;
  min-height: 70px;
  color: #fff;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid #fff;

  &:last-child{border: none}

  &-1{background-color: #E1ADD9;}
  &-2{background-color: #D75FAA;}
  &-3{background-color: #C34F88;}
  &-4{background-color: #5B3569;}
  &-5{background-color: #1F2C4F;}

  &-price-max{
    position: absolute;
    right: 0;
    top: 5px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;

    b{
      padding: 0 5px;
      opacity: 0.8;
    }
  }

  &-tax{
  }

  &-pourcentage{
    position: absolute;
    left: 15px;
    top: 0;
    height: 100%;
    text-align: right;
    font-size: 1.6rem;
    display: flex;
    align-items: center;
  }
}
</style>
