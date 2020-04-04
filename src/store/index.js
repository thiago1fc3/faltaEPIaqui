import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    jwt: null
  },
  mutations: {
    SET(state, user) {
      state.user = user
    },
    SET_JWT(state, jwt) {
      state.jwt = jwt
    },
    clearProfile(state) {
      state.user = null
      state.jwt = null
    }
  },
  actions: {
  },
  modules: {
  }
})
