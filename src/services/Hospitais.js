import { RestClient } from "./RestClient";

export const hospitais = new (class extends RestClient {
    constructor() {
        super("/api/hospitais");
    }

    encaminharPedido(id, data = [], config = {}) {
        return this.request({
            method: "PATCH",
            url: `${id}/encaminhar_pedido`,
            data
        }).then(r => r.data);
    }

    darBaixaPedido(id, data = [], config = {}) {
        return this.request({
            method: "PATCH",
            url: `${id}/dar_baixa`,
            data
        }).then(r => r.data);
    }
})();