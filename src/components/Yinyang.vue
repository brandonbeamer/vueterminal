<template>
  <div class="container">
    <img ref="yinyang" src="../assets/yinyang.svg">
  </div>
</template>

<script>
export default {
  mounted () {
    const gradientList = [
      [0, '#050416', '#1c184b'], // midnight
      [1 / 6, '#050416', '#1c184b'], // 4 a.m.
      [0.25, '#9573d2', '#ce6488'], // 6 a.m.
      [0.5, '#0363a9', '#82cded'], // noon
      [0.75, '#5d6093', '#ff9f6a'], // 6 p.m.
      [5 / 6, '#050416', '#3a6daf'], // 8 p.m. ?
      [1, '#050416', '#1c184b'] // midnight
    ]

    function interpolate2 (c1, c2, p) {
      // interpolates two colors, c1 and c2 are 6-digit rgb hex colors, and 0 <=
      // p <= 1 is the interpolation point
      c1 = c1.replace(/^#/, '')
      c2 = c2.replace(/^#/, '')

      const r = Math.ceil(parseInt(c1.substring(0, 2), 16) * (1 - p) + parseInt(c2.substring(0, 2), 16) * p)
      const g = Math.ceil(parseInt(c1.substring(2, 4), 16) * (1 - p) + parseInt(c2.substring(2, 4), 16) * p)
      const b = Math.ceil(parseInt(c1.substring(4, 6), 16) * (1 - p) + parseInt(c2.substring(4, 6), 16) * p)

      return '#' + [r, g, b].map((val) => {
        const hex = val.toString(16)
        return (hex.length === 1) ? '0' + hex : hex
      }).reduce((a, b) => { return a + b })
    }

    function interpolateMany (gList, p) {
      // takes in a list of gradients and returns an index and modified p
      // assumes list of gradients is sorted
      // gradientList must start with a '0' point and end with a '1' point

      if (gList[0][0] !== 0) {
        throw Error('Gradient list must start with a zero (0) point.')
      }

      let i1
      let i2
      for (let i = 0; i < gList.length; i++) {
        if (p < gList[i][0]) {
          i1 = i - 1
          i2 = i
          break
        }
      }

      if (i1 === undefined) {
        throw Error('Probably forgot to define a (1) point.')
      }

      return {
        gradient1: gList[i1].slice(1),
        gradient2: gList[i2].slice(1),
        percent: (p - gList[i1][0]) / (gList[i2][0] - gList[i1][0])
      }
    }

    setInterval(() => {
      // update gradient
      const d = new Date()

      // shorter loop time for debugging
      // const p = (d.getSeconds() * 1000 + d.getMilliseconds()) / 60000
      // const fakeHours = Math.floor(p * 24)
      // const fakeMinutes = Math.floor(((p * 24) - Math.floor(p * 24)) * 60)
      // console.log(`Time: ${fakeHours}:${fakeMinutes}`)

      const p = (d.getSeconds() + d.getMinutes() * 60 + d.getHours() * 3600) / (24 * 3600)
      const gInterp = interpolateMany(gradientList, p)
      // console.log('p:', p)
      const curGradient = [
        interpolate2(gInterp.gradient1[0], gInterp.gradient2[0], gInterp.percent),
        interpolate2(gInterp.gradient1[1], gInterp.gradient2[1], gInterp.percent)
      ]
      // console.log(curGradient)

      this.$el.style.background = `linear-gradient(${curGradient[0]}, ${curGradient[1]})`

      const angle = p * 360
      this.$refs.yinyang.style.transform = `translateX(50%) rotate(${angle + 180}deg) scale(1.5, 1.5)`
    }, 100)
  }
}
</script>

<style lang="scss" scoped>

.container {
  //display: inline-block;
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  text-align: center;
  background-color: black;
}

.container img {
  //filter: blur(20px) opacity(0.75);
  filter: opacity(0.03);
  height: 100%;
}

</style>
