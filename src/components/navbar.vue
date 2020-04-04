<template>
  <div class="navbar">
    
    <div>
      <img src="@/assets/img/logo.png" alt="Logo do Sistema Quero EPI">
      <h3>QueroEPI</h3>
    </div>

    <div class="user-dropdown">
      <div class="dropdown">
        <button class="dropbtn">Usuário logado</button>
        <div class="dropdown-content">
        <span @click="logout()">Sair</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  methods: {
    async logout() {
      try {
        console.log("teste")
        // this.store.state.user = {}
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
  .user-dropdown {
    .dropbtn {
      background-color: transparent;
      color: white;
      padding: 16px;
      font-size: 16px;
      border: none;
      cursor: pointer;
    }

    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #f9f9f9;
      max-width: 160px;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      z-index: 1000;
    }

    .dropdown-content span {
      display: block;
      cursor: pointer;
      color: black;
      padding: 12px 16px;
      text-decoration: none;
      max-width: 160px;

      &:hover {
        background-color: #f1f1f1;
      }
    }

    .dropdown:hover .dropdown-content {
      display: block;
    }

    .dropdown:hover .dropbtn {
      background-color: rgba(0,0,0,0.2);
    }
  }
}
</style>