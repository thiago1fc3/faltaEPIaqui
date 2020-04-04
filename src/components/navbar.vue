<template>
  <div class="navbar">
    
    <div>
      <img src="@/assets/img/logo.png" alt="Logo do Sistema Quero EPI">
      <h3>QueroEPI</h3>
    </div>

    <div class="logout" @click="logout()">
      <span>Sair</span>
      <i class="pi pi-sign-out"></i>
    </div>

  </div>
</template>

<script>
export default {
  methods: {
    async logout() {
      try {
        this.$oauth.logout()
        this.$router.push('/login')
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

<style lang="scss">
.navbar {
  height: 50px;
  width: 100%;
  background-color: #18655b;
  padding: 0 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  div {
    display: flex;
    flex-direction: row;
    align-items: center;
  
    img {
      height: 40px;
      margin-right: 15px;
    }
    h3 {
      border-left: 1px solid white;
      padding-left: 10px;
      color: #fff;
    }
  }
  .logout {
    color: white;
    cursor: pointer;

    span {
      margin-right: 5px;
    }
    &:hover {
      color: rgba($color: #fff, $alpha: 0.8);
    }
  }
}
</style>