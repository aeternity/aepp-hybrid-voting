<template>
  <input
    class="ae-input-range"
    :class="[fill]"
    :value="value"
    v-bind="$attrs"
    type="range"
    @input="$emit($event.type, +$event.target.value)"
  >
</template>

<script>
  export default {
    props: {
      value: { type: [String, Number], default: '' },
      fill: {
        type: String,
        validator: value => [
          'primary',
          'light',
        ].includes(value),
        default: 'primary',
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import '~@aeternity/aepp-components/src/styles/placeholders/typography.scss';
  @import '~@aeternity/aepp-components/src/styles/variables/colors.scss';
  .ae-input-range {
    -webkit-appearance: none;
    width: 100%;
    cursor: pointer;
    height: 15px;
    $colors: (
      primary: (
        track-color: $color-neutral-positive-1,
        progress-color: $color-primary,
        thumb-color: $color-primary,
      ),
      light: (
        track-color: $color-primary-positive-1,
        progress-color: $color-neutral-maximum,
        thumb-color: $color-neutral-maximum,
      ),
    );
    @mixin range-track($background-color) {
      width: 100%;
      height: rem(2px);
      background: $background-color;
    }
    @each $fill, $colors in $colors {
      &.#{$fill} {
        @each $name in (
          -webkit-slider-runnable-track,
          -moz-range-track,
          -ms-track,
          -ms-fill-upper,
        ) {
          &::#{$name} {
            @include range-track(map-get($colors, track-color));
          }
        }
        @each $name in -moz-range-progress -ms-fill-lower {
          &::#{$name} {
            @include range-track(map-get($colors, progress-color));
          }
        }
        @each $name in -webkit-slider-thumb -moz-range-thumb -ms-thumb {
          &::#{$name} {
            height: rem(26px);
            width: rem(26px);
            border-radius: rem(150px);
            background: map-get($colors, thumb-color);
            cursor: pointer;
          }
        }
      }
    }
    &:focus:not([data-focus-visible-added]) {
      outline: none;
    }
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      margin-top: rem(-13px);
    }
    &::-moz-range-thumb {
      border: none;
    }
    &::-ms-track {
      background: transparent;
      border-color: transparent;
      color: transparent;
    }
  }
</style>
