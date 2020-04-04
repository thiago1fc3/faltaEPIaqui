<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Roboto&display=swap");

html, 
body, 
#app {
  height: 100%;
  width: 100%;
  overflow-y: hidden;
}

body {
  box-sizing: border-box;
  font-family: "Roboto", sans-serif;
  line-height: 1.4;
  padding: 0;
  box-sizing: border-box;
  margin: 0;
}
</style>
