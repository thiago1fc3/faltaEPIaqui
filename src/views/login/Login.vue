<template>
  <div class="login">
    <div class="form-login">

      <img src="@/assets/img/logo.png" class="logo" alt="Logo do Sistema Falta EPI Aqui">
      <h4 class="title">#QueroEPI</h4>

      <form id="form">
        <div class="group">
          <label for="mail">Email</label>
          <input type="text" id="mail" v-model="mail" placeholder="Digite seu email..." required="required">
        </div>

        <div class="group">
          <label for="password">Senha</label>
          <input type="password" id="password"  v-model="pwd" placeholder="Digite sua senha..." required="required">
        </div>
        
        <div class="error" v-show="errMessage != ''">
          {{ errMessage }}
        </div>

        <button class="btn-login" @click.prevent.stop="login()">ENTRAR</button>
      </form>

    </div>
  </div>
</template>

<script>
export default {

  data() {
    return {
      mail: '',
      pwd: '',
      errMessage: ''
    }
  },

  mounted() {
    if(this.$store.state.user && this.$store.state.user.user_name)
      this.$router.push('/')
  },

  methods: {
    async login() {
      try {
        var inp = document.getElementById("form");

        if (inp.checkValidity()) {
          const resp = await this.$oauth.login(this.mail, this.pwd)
            .then(res => {
              this.$router.push('/')
            })
            .catch(error => {
              this.err = true;
              this.errMessage =
                error.response && error.response.data.error === "invalid_grant"
                  ? "Usuário e/ou senha inválidos!"
                  : "Verifique suas credenciais";
              console.error(error);
            });
        }
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

<style lang="scss">
.login {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #EEE;

  .form-login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 20px;
    background-color: #18655b;
    border-radius: 5px;

    img.logo {
      height: 50px;
      width: 40px;
    }
    .title {
      color: #fff;
      margin-bottom: 10px;
    }

    form {
      width: 100%;
      .group {
        display: flex;
        flex-direction: column;
        width: 100%;

        label {
          color: #fff;
          margin-top: 5px;
        }
        input {
          padding: 10px 5px;
          border-radius: 3px;
          border: 1px solid #eee;
        }
      }
      .error {
        padding: 10px;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 3px;
        color: #721c24;
        margin-top: 10px;
        text-align: center;
      }
      .btn-login {
        margin-top: 10px;
        width: 100%;
        padding: 10px;
        background-color: transparent;
        color: #fff;
        border: 1px solid #fff;
        border-radius: 3px;
        transition: 0.2s all;
        font-weight: 600;

        &:hover {
          cursor: pointer;
          background-color: white;
          color: #000;
        }
        &:focus,
        &:active {
          outline: none;
          box-shadow: none;
        }
      }
    }
  }

  @media(max-width: 576px) {
    .form-login {
      width: 90%;
    }
  }
  @media(min-width: 576px) {
    .form-login {
      width: 350px;
    }
  }
}
</style>