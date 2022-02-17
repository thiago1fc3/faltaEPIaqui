<template>
  <div ref="info">
    <template v-if="hospitalId && hospital && hospitalId === hospital.id">
      <h2>{{hospital.nome}}</h2>
      <div class="p-grid">
        <div class="p-col-8 p-col-align-center">
          {{hospital.contato}}
          <br />
          <strong>{{hospital.telefone}}</strong>
        </div>
        <div class="p-col-4 p-col-align-end">
          Última atualização:
          <strong>{{clock}}</strong>
        </div>
      </div>

      <div class="p-grid p-justify-center">
        <div class="p-col-12">
          <table>
            <thead>
              <tr>
                <th>EPI</th>
                <th align="center">Pedido</th>
                <th
                  v-if="hospital.status === 'PEDIDO_REALIZADO' || hospital.status === 'PEDIDO_ENCAMINHADO'"
                  align="center"
                >
                  <template v-if="hospital.status === 'PEDIDO_REALIZADO'">Será enviado</template>
                  <template v-else-if="hospital.status === 'PEDIDO_ENCAMINHADO'">Foi enviado</template>
                </th>
                <th align="center">Já foi entregue</th>
              </tr>
            </thead>
            <tfoot>
              <tr class="t-center">
                <td align="right">
                  <strong>Total</strong>
                </td>
                <td align="center">{{totalNecessidade}}</td>
                <td
                  v-if="hospital.status === 'PEDIDO_REALIZADO' || hospital.status === 'PEDIDO_ENCAMINHADO'"
                  align="center"
                >{{totalEnviar}}</td>
                <td align="center">{{totalEntregue}}</td>
              </tr>
            </tfoot>
            <tbody>
              <tr v-for="epi in hospital.epis" :key="epi.id">
                <td>
                  {{epi.descricao }}
                  <strong>({{epi.unidade}})</strong>
                </td>
                <td align="center">{{epi.qtd}}</td>
                <td
                  v-if="hospital.status === 'PEDIDO_REALIZADO' || hospital.status === 'PEDIDO_ENCAMINHADO'"
                  align="center"
                >
                  <div style="width: 100px" v-if="hospital.status === 'PEDIDO_REALIZADO'">
                    <InputText
                      style="width: 100%; text-align: center"
                      :min="0"
                      type="number"
                      v-model="epi.qtdEnviada"
                    />
                  </div>
                  <template v-else>{{epi.qtdEnviada}}</template>
                </td>
                <td align="center">{{epi.qtdEntregue}}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-col-12">
          <div class="p-grid p-justify-between">
            <div class="p-col-7 p-col-align-center">
              <div>{{hospital.endereco.formatado}}</div>
            </div>
            <div style="text-align: center" class="p-col-5 p-col-align-center">
              <template v-if="hospital.status === 'PEDIDO_ENCAMINHADO'">
                <div class="p-grid align-center">
                  <div class="p-col-12">
                    <strong>Confirmar entrega?</strong>
                  </div>
                </div>
                <div class="p-grid">
                  <div class="p-col-6">
                    <Button
                      @click.prevent.stop="darBaixaPedido()"
                      class="p-button-primary"
                      icon="pi pi-check"
                      iconPos="left"
                      label="SIM"
                    />
                  </div>
                  <div class="p-col-6">
                    <Button
                      @click.prevent.stop="darBaixaPedidoFalse()"
                      class="p-button-danger"
                      icon="pi pi-check"
                      iconPos="left"
                      label="NÃO"
                    />
                  </div>
                </div>
              </template>

              <Button
                v-if="hospital.status === 'PEDIDO_REALIZADO'"
                @click.prevent.stop="encaminharPedido()"
                class="p-button-info"
                icon="pi pi-angle-double-right"
                iconPos="right"
                label="ENCAMINHAR"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="p-grid p-align-center">
        <ProgressSpinner />
      </div>
    </template>
  </div>
</template>

<script>
import moment from "moment";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ProgressSpinner from "primevue/progressspinner";
export default {
  props: ["hospitalId"],
  components: {
    Button,
    InputText,
    ProgressSpinner
  },
  data() {
    return {
      hospital: null,
      clock: moment()
    };
  },

  mounted() {
    setInterval(this.updatedClock, 1000);
  },

  async updated() {
    if (
      !this.hospital ||
      (this.hospital && this.hospitalId && this.hospitalId !== this.hospital.id)
    )
      this.hospital = await this.$rest.hospitais.findById(this.hospitalId);
  },

  computed: {
    totalNecessidade() {
      return this.hospital.epis
        .map(epi => epi.qtd)
        .reduce((x, y) => parseInt(x) + parseInt(y), 0);
    },

    totalEntregue() {
      return this.hospital.epis
        .map(epi => epi.qtdEntregue)
        .reduce((x, y) => parseInt(x) + parseInt(y), 0);
    },

    totalEnviar() {
      return this.hospital.epis
        .map(epi => epi.qtdEnviada)
        .reduce((x, y) => parseInt(x) + parseInt(y), 0);
    }
  },
  methods: {
    encaminharPedido() {
      let epis = this.hospital.epis.map(epi => {
        return { id: epi.id, qtd: epi.qtdEnviada };
      });
      this.$rest.hospitais
        .encaminharPedido(this.hospital.id, epis)
        .then(async resp => {
          this.hospital.status = resp;
          await this.$emit("update", { id: this.hospital.id, status: resp });
          this.hospital = null;
        });
    },

    darBaixaPedido() {
      let epis = this.hospital.epis.map(epi => {
        return { id: epi.id, qtd: epi.qtdEnviada };
      });
      this.$rest.hospitais
        .darBaixaPedido(this.hospital.id, epis)
        .then(async resp => {
          this.hospital.status = resp;
          await this.$emit("update", { id: this.hospital.id, status: resp });
          this.hospital = null;
        });
    },

    darBaixaPedidoFalse() {
      let epis = this.hospital.epis.map(epi => {
        return { id: epi.id, qtd: epi.qtdEnviada };
      });
      this.$rest.hospitais
        .darBaixaPedidoFalse(this.hospital.id, epis)
        .then(async resp => {
          this.hospital.status = resp;
          await this.$emit("update", { id: this.hospital.id, status: resp });
          this.hospital = null;
        });
    },

    updatedClock() {
      let now = moment().valueOf();
      if (this.hospital) {
        let then = moment(this.hospital.updatedAt).valueOf();
        let d = moment.duration(now - then, "milliseconds");
        this.clock = moment.utc(d.asMilliseconds()).format("HH:mm:ss");
      }
    }
  }
};
</script>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

table,
th,
td {
  border-bottom: 1px solid #ddd;

  vertical-align: center;
  padding: 0.25rem;
}

tr:hover {
  background-color: #f5f5f5;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}

t-center {
  text-align: center;
}
</style>