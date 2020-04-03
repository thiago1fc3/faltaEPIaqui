<template>
  <div ref="info">
    <template v-if="hospitalId && hospital && hospitalId === hospital.id">
      <h1>{{hospital.nome}}</h1>
      <h3>
        {{hospital.contato}}
        <br />
        {{hospital.telefone}}
      </h3>
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
                <td>{{epi.descricao}}</td>
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
            <div class="p-col-7">
              <div>{{hospital.endereco.formatado}}</div>
            </div>
            <div style="text-align: right" class="p-col-5 align-end">
              <Button
                v-if="hospital.status === 'PEDIDO_ENCAMINHADO'"
                @click.prevent.stop="darBaixaPedido()"
                class="p-button-primary"
                icon="pi pi-check"
                iconPos="left"
                label="DAR BAIXA"
              />
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
      hospital: null
    };
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