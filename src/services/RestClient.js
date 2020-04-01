import Axios from "axios";
import Vue from "vue";
import { API_URL } from "@/config";

const isNotSet = v => v == null || v == undefined;

let noInternetToastId = null
const noInternet = () => {
  Vue.$toast.dismiss(noInternetToastId)
  noInternetToastId = Vue.$toast("Não há conexão com o servidor!", {
    type: "error",
    timeout: 10000
  });
}

/**
 * Cria um cliente REST
 * @class HttpService
 */
export class RestClient {
  constructor(baseURL) {
    baseURL = /^\w+:\/\//.test(baseURL)
      ? baseURL
      : [API_URL, baseURL].join(API_URL.endsWith("/") ? "" : "/");
    this.request = Axios.create({ baseURL });

    // OAuth Interceptor
    // this.request.interceptors.request.use(async req => {
    //   if (!req.noBearer) {
    //     const token = await Auth.checkAccessToken();
    //     if (token) {
    //       req.headers.Authorization = `Bearer ${token}`;
    //     }
    //   }
    //   return req;
    // });

    // Error Interceptor
    this.request.interceptors.response.use(
      response => response,
      error => {
        if (!error.request) throw error;

        error.request.noToast =
          error.request.noToast ||
          (error.response && error.response.status === 404);

        if (error.request.noToast) throw error;
        if (!error.response || !error.response.status) {
          noInternet()
          throw error;
        }

        const { status, data } = error.response;

        if (data.message) {
          Vue.$toast(data.message, {
            timeout: 5000,
            type: status % 500 < 100 ? "error" : "warning"
          });
        } else {
          Vue.$toast("Falha na requisição", {
            timeout: 5000,
            type: status % 500 < 100 ? "error" : "warning"
          });
        }

        error.response.config.toasted = true;

        throw error;
      }
    );
  }

  /**
   * Lista todos os itens de um recurso
   * @param {Object} params Parâmetros de URL
   * @returns {Promise}
   */
  async findAll(params = {}, config = {}) {
    return this.request
      .get("", {
        params,
        ...config
      })
      .then(r => r.data);
  }

  /**
   * Lista um item de um recurso
   * @param {String|number} id
   * @param {Object} params Parâmetros de URL
   * @returns {Promise}
   */
  async findById(id, params = {}, config = {}) {
    if (isNotSet(id)) {
      throw new TypeError(
        `Nenhum ID foi passado para ${this.constructor.name}#findById().`
      );
    }
    return this.request
      .get(`${id}`, {
        params,
        ...config
      })
      .then(r => r.data);
  }

  /**
   * Cria um item no recurso
   * @param {Object} data
   * @param {Object} params Parâmetros de URL
   * @returns {Promise}
   */
  async create(data, params = {}, config = {}) {
    if (isNotSet(data)) {
      throw new TypeError(
        `Nenhum dado foi enviado para ${this.constructor.name}#create()`
      );
    }
    delete data.id;
    return this.request
      .post("", data, {
        params,
        ...config
      })
      .then(r => r.data);
  }

  /**
   * Atualiza um item no recurso
   * @param {Object} data Campos a serem atualizados
   * @param {string|number} data.id Id do recurso a ser atualizado
   * @param {Object} params Parâmetros de URL
   * @returns {Promise}
   */
  async update(data, params = {}, config = {}) {
    if (isNotSet(data)) {
      throw new TypeError(
        `Nenhum dado foi passado para ${this.constructor.name}#update()`
      );
    }
    if (isNotSet(data.id)) {
      throw new TypeError(
        `O campo data.id não foi passado para ${this.constructor.name}#update()`
      );
    }
    return this.request
      .patch(data.id, data, {
        params,
        ...config
      })
      .then(r => r.data);
  }

  /**
   * Cria ou atualiza um item no recurso
   * @param {Object.<string>} data Dados do recurso
   * @param {string|number} [data.id] Id do recurso (caso queira atualizar)
   * @param {Object} params Parâmetros de URL
   * @returns {Promise}
   */
  save(data, params = {}, config = {}) {
    if (isNotSet(data)) {
      throw new TypeError(
        `Nenhum dado foi passado para ${this.constructor.name}#save()`
      );
    }
    return isNotSet(data.id)
      ? this.create(data, params, config)
      : this.update(data, params, config);
  }

  /**
   * Exclui um recurso
   * @param {string|number} id
   * @param {Object} params Parâmetros de URL
   * @returns {Promise}
   */
  async delete(id, params = {}, config = {}) {
    if (isNotSet(id)) {
      throw new TypeError(
        `ID não foi passado para ${this.constructor.name}#delete()`
      );
    }
    return this.request
      .delete(`${id}`, {
        params,
        ...config
      })
      .then(r => r.data);
  }

  savePartial(data, route = "", params = {}, config = {}) {
    return this.request({
      method: data.id ? "PATCH" : "POST",
      url: data.id ? [data.id, route].join("/") : route,
      data,
      params,
      ...config
    }).then(r => r.data);
  }

  getByIdPartial(id, route = "", params = {}, config = {}) {
    return this.request({
      method: "GET",
      url: [id, route].join("/"),
      params,
      ...config
    }).then(r => r.data);
  }
}
