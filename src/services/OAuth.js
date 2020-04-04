import JWTDecode from 'jwt-decode'
import Axios from 'axios'
import qs from 'querystring'
import { API_URL } from '@/config'
import store from '@/store/'

const _refresh_token = "refresh_token"
const _access_token = "access_token"

function debug(...messages) {
    console.debug('[AUTH]', ...messages)
}

export default class OAuthTokenService {
    constructor() {
        this.browserId;
        this.axios = Axios.create({
            baseURL: API_URL,
            //withCredentials: true,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic cXVlcm8uZXBpLndlYjpzM2NyM3QtNHAx'
            }
        })

        this.timeOffset = 0
    }

    async getTimeOffset() {
        const timestampServer = new Date(await this.axios.get('/sts/timestamp').then(r => r.data)).getTime()
        const timestampClient = Date.now()

        this.timeOffset = timestampClient - timestampServer

        return this.timeOffset
    }

    get accessToken() {
        return localStorage.getItem(_access_token)
    }

    set accessToken(v) {
        if (v == null) {
            localStorage.removeItem(_access_token)
        } else localStorage.setItem(_access_token, v)
    }

    get refreshToken() {
        return localStorage.getItem(_refresh_token)
    }

    set refreshToken(v) {
        if (v == null) {
            localStorage.removeItem(_refresh_token)
        } else {
            localStorage.setItem(_refresh_token, v)
        }
    }

    get payload() {
        try {
            return JWTDecode(this.accessToken)
        } catch (e) {
            return null
        }
    }

    requestToken(data) {
        return this.axios({
            method: 'POST',
            url: '/sts/oauth/token',
            //withCredentials: false,
            data: qs.stringify(data)
        }).then(res => res.data)
    }

    get isAuthenticated() {
        const payload = this.payload
        return !!payload
    }

    tokenIsExpired() {
        const { payload } = this

        if (!payload || !payload.exp) return false
        return (Date.now() - this.timeOffset) / 1000 >= payload.exp
    }

    refreshAccessToken() {
        return this.requestToken({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        })
            .then(res => this.setToken(res))
            .catch(async error => {
                if (error.response && error.response.status === 401) {
                    await this.logout(true)
                    return null
                }

                throw error
            })
    }

    async setToken({ access_token, refresh_token }) {
        this.accessToken = access_token
        this.refreshToken = refresh_token

        return access_token
    }

    async getUser() {
      const { payload = {} } = this;
      store.commit('SET', payload )
    }

    async checkAccessToken() {
        if (this.tokenIsExpired())
            await this.refreshAccessToken()

        return this.accessToken
    }

    login(username, password, domain) {
        return this.requestToken({
            grant_type: 'password',
            username,
            password
        }).then(async res => {
            const result = await this.setToken(res)
            await this.getUser()
            
            return result;
        })
    }

    async logout() {
      store.commit('SET', null )
      store.commit('SET_JWT', null )
    }
}

export const Auth = new OAuthTokenService()
