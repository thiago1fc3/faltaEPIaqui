<template>
  <div class="flexgrid-container">
    <div class="p-grid basic-layout">
      <div class="p-col-12 p-md-3">
        <Card>
          <template slot="title">LAR</template>
          <template slot="content">
            <span class="p-float-label">
              <InputText style="width: 100%" v-model="filter.q" @input="dSearch" />
              <label for="busca">Busca geral</label>
            </span>
          </template>
        </Card>
        <Card>
          <template slot="content">
            <span class="p-float-label">
              <InputText
                style="width: 100%"
                class="my-1"
                v-model="filter.google"
                @input="dSearch"
                placeholder
              />
              <label for="busca">Por Estado, Rua, Cidade, etc.</label>
            </span>
          </template>
        </Card>
        <Card>
          <template slot="title">Status</template>
          <template slot="content">
            <div>
              <Checkbox @change="dSearch" v-model="filter.status" value="NOVO" id="novo" />
              <label class="p-checkbox-label" for="novo">Novos hospitais</label>
            </div>
            <div>
              <Checkbox
                @change="dSearch"
                v-model="filter.status"
                value="PEDIDO_REALIZADO"
                id="realizado"
              />
              <label class="p-checkbox-label" for="realizado">Pedidos realizados</label>
            </div>
            <div>
              <Checkbox
                @change="dSearch"
                v-model="filter.status"
                value="PEDIDO_ENCAMINHADO"
                id="encaminhado"
              />
              <label class="p-checkbox-label" for="encaminhado">Encaminhados</label>
            </div>
            <div>
              <Checkbox
                @change="dSearch"
                v-model="filter.status"
                value="PEDIDO_ENTREGUE"
                id="entregue"
              />
              <label class="p-checkbox-label" for="entregue">Entregues</label>
            </div>
          </template>
        </Card>

        <Card>
          <template slot="title">EPIs</template>
          <template slot="content">
            <div v-for="epi in epis" :key="epi.id">
              <Checkbox @change="dSearch" v-model="filter.epis" :value="epi.id" :id="epi.id" />
              <label class="p-checkbox-label" :for="epi.id">{{epi.descricao}}</label>
            </div>
          </template>
        </Card>
      </div>
      <div class="p-col-12 p-md-9">
        <div id="map" class="map"></div>
      </div>
    </div>
    <InfoHospital
      @update="clear($event)"
      ref="infoHospital"
      v-show="selectedHospital.id"
      :hospital="selectedHospital"
    ></InfoHospital>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import "@/assets/js/leaflet/icon-material.css";
import L from "leaflet";
import "leaflet.heat";
import "@/assets/js/leaflet/icon-material.js";
import { debounce } from "@/util";
import InfoHospital from "./InfoHospital";

import Checkbox from "primevue/checkbox";
import Card from "primevue/card";
import InputText from "primevue/inputtext";

export default {
  components: {
    Checkbox,
    Card,
    InfoHospital,
    InputText
  },
  data() {
    return {
      filter: {
        q: "",
        status: [],
        epis: []
      },
      epis: [],
      hospitais: [],
      selectedHospital: {
        nome: "",
        contato: "",
        telefone: "",
        endereco: {},
        epis: []
      },
      map: null,
      dSearch: debounce(() => this.search(), 200),
      heatLayer: null,
      markersGroup: null,

      yellowIcon: L.IconMaterial.icon({
        icon: "local_pharmacy",
        markerColor: this.iconColors()[0],
        outlineWidth: 0
      }),

      redIcon: L.IconMaterial.icon({
        icon: "local_pharmacy",
        markerColor: this.iconColors()[1],
        outlineWidth: 0
      }),

      blueIcon: L.IconMaterial.icon({
        icon: "local_pharmacy",
        markerColor: this.iconColors()[2],
        outlineWidth: 0
      }),

      greeIcon: L.IconMaterial.icon({
        icon: "local_pharmacy",
        markerColor: this.iconColors()[3],
        outlineWidth: 0
      })
    };
  },
  mounted() {
    this.map = L.map("map").setView([-3.71664, -38.5423], 6);
    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    this.markersGroup = L.featureGroup()
      .bindPopup("", { minWidth: "400" })
      .on("click", e => {
        this.selectedHospital = this.filterHospitalById(e.layer._id);
        let info = this.$refs["infoHospital"].$refs.info;
        this.markersGroup.setPopupContent(info);
      })
      .addTo(this.map);
  },
  created() {
    this.getEpis();
    this.search();
  },

  methods: {
    getEpis() {
      this.$rest.epis.findAll().then(resp => {
        this.epis = resp;
      });
    },
    async search() {
      this.clearHeatLayer();
      this.clearMarkers();
      this.hospitais = await this.$rest.hospitais.findAll(this.filter);
      if (!this.hospitais || !this.hospitais.length) return;
      this.setHeatLayer(this.hospitais);
      this.setMarkers(this.hospitais);
    },

    setHeatLayer(hospitais) {
      let coordinates = hospitais.map(
        h =>
          h.endereco &&
          h.endereco.geo && [h.endereco.geo.x, h.endereco.geo.y, 100]
      );
      if (!coordinates) return;

      this.heatLayer = L.heatLayer(coordinates).addTo(this.map);
    },

    setMarkers(hospitais) {
      let icons = {
        NOVO: this.yellowIcon,
        PEDIDO_REALIZADO: this.redIcon,
        PEDIDO_ENCAMINHADO: this.blueIcon,
        PEDIDO_ENTREGUE: this.greeIcon
      };

      for (let i = 0; i < hospitais.length; i++) {
        const h = hospitais[i];
        let mark = L.marker(h.endereco.geo.coordinates, {
          icon: icons[h.status]
        });
        mark._id = h.id;
        this.markersGroup.addLayer(mark);
      }

      if (this.markersGroup.getBounds().isValid()) {
        this.map.fitBounds(this.markersGroup.getBounds());
      }
    },

    clearHeatLayer() {
      if (this.heatLayer) this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    },

    clearMarkers() {
      if (this.markersGroup) this.markersGroup.clearLayers();
    },

    filterHospitalById(_id) {
      return this.hospitais.find(h => h.id === _id);
    },

    clear(e) {
      let icons = {
        NOVO: this.yellowIcon,
        PEDIDO_REALIZADO: this.redIcon,
        PEDIDO_ENCAMINHADO: this.blueIcon,
        PEDIDO_ENTREGUE: this.greeIcon
      };
      this.selectedHospital = {
        nome: "",
        contato: "",
        telefone: "",
        endereco: {},
        epis: []
      };

      let marker = this.markersGroup.getLayers().find(l => l._id === e.id);

      this.markersGroup.removeLayer(marker);
      marker.icon = icons[e.status];
      this.markersGroup.closePopup();
      this.markersGroup.addLayer(marker);
      this.map.invalidateSize();
    },

    iconColors() {
      return [
        "rgba(200,200,50,0.9)",
        "rgba(200, 0, 0,0.9)",
        "rgba(30, 139, 195,0.9)",
        "rgba(0, 200, 0,0.9)"
      ];
    }
  }
};
</script>

<style lang="scss">
.flexgrid-container {
  .box,
  .basic-layout > div {
    background-color: #f1f1f1;

    background-color: #18655b;
  }

  .box-stretched {
    height: 100%;
  }

  .basic-layout {
    margin: 0;
    height: 100vh;
  }

  .map {
    width: 100%;
    height: 100%;
  }
}
</style>