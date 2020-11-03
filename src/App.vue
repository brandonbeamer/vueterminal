<template>
  <div id="app">
    <Yinyang />
    <div class="terminal-container">
      <Terminal id="terminal" />
    </div>
  </div>
</template>

<script>
import Terminal from '@/components/Terminal'
import Yinyang from '@/components/Yinyang'
// import Background from '@/components/Background'
export default {
  name: 'App',
  components: {
    Terminal, Yinyang
  }
}
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

body {
  padding: 0;
  margin: 0;
  // background: linear-gradient(#7a919a, #070523);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;

}

.terminal-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  // &:before {
  //   content: "";
  //   position: absolute;
  //   z-index: -1;
  //   width: 100%;
  //   height: 100%;
  //   background-image: url('./assets/yinyang.svg');
  //   background-size: cover;
  //   filter: blur(20px);
  //   @media screen and (orientation: portrait) {
  //     transform: translateX(30%)
  //   }

  //   @media screen and (orientation: landscape) {
  //     transform: translateY(30%)
  //   }
  // }

}

#terminal {
  height: 100%;
  width: 100%;
}
</style>
