<template>
  <div class="flexgrid-container">
    <div class="p-grid basic-layout">
      <div class="p-col-12 p-md-3">
        <div class="menu">
          <div>
            <span class="p-float-label">
              <InputText style="width: 100%" v-model="filter.q" @input="dSearch" />
              <label for="busca">Busca geral</label>
            </span>
          </div>
          <div style="margin: 1.5rem 0">
            <span class="p-float-label">
              <InputText style="width: 100%" v-model="filter.google" @input="dSearch" placeholder />
              <label for="busca">Por Estado, Rua, Cidade, etc.</label>
            </span>
          </div>
          <div>
            <h3>Status</h3>
            <div>
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
            </div>
            <div>
              <h3>EPIs</h3>
              <div>
                <div v-for="epi in epis" :key="epi.id">
                  <Checkbox @change="dSearch" v-model="filter.epis" :value="epi.id" :id="epi.id" />
                  <label class="p-checkbox-label" :for="epi.id">{{epi.descricao}}</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="logo">
          <img width="50" src="@/assets/img/logo.png" alt />
        </div>
      </div>
      <div class="p-col-12 p-md-9">
        <div id="map" class="map"></div>
      </div>
    </div>
    <InfoHospital
      @update="clear($event)"
      ref="infoHospital"
      v-show="selectedHospitalId"
      :hospitalId="selectedHospitalId"
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
import InputText from "primevue/inputtext";
import { API_URL } from "@/config";
export default {
  components: {
    Checkbox,
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
      selectedHospitalId: null,
      map: null,
      dSearch: debounce(() => this.search(), 200),
      heatLayer: null,
      markersGroup: null,

      icons: {
        NOVO: L.IconMaterial.icon({
          icon: "local_pharmacy",
          markerColor: "rgba(200,200,50,0.9)",
          outlineWidth: 0
        }),

        PEDIDO_REALIZADO: L.IconMaterial.icon({
          icon: "local_pharmacy",
          markerColor: "rgba(200, 0, 0,0.9)",
          outlineWidth: 0
        }),

        PEDIDO_ENCAMINHADO: L.IconMaterial.icon({
          icon: "local_pharmacy",
          markerColor: "rgba(30, 139, 195,0.9)",
          outlineWidth: 0
        }),

        PEDIDO_ENTREGUE: L.IconMaterial.icon({
          icon: "local_pharmacy",
          markerColor: "rgba(0, 200, 0,0.9)",
          outlineWidth: 0
        })
      }
    };
  },
  mounted() {
    this.map = L.map("map", { zoomControl: false }).setView(
      [-3.71664, -38.5423],
      6
    );
    L.tileLayer(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      {
        attribution:
          '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(this.map);
    this.markersGroup = L.featureGroup()
      .bindPopup("", { minWidth: "400" })
      .on("click", async e => {
        this.selectedHospitalId = e.layer._id;
        let info = this.$refs["infoHospital"].$refs.info;
        this.markersGroup.setPopupContent(info);
      })
      .on("popupclose", e => {
        this.selectedHospitalId = null;
      })
      .addTo(this.map);
  },
  created() {
    this.getEpis();
    this.search();

    let evtSource = new EventSource(`${API_URL}/stream/web`);

    evtSource.onmessage = e => {
      let event = JSON.parse(e.data);
      if (event) {
        this.updateMarker(event.data);
        this.map.fitBounds(this.markersGroup.getBounds());
      }
    };
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
      this.clearHeatLayer();
      let coordinates = hospitais.map(
        h =>
          h.endereco &&
          h.endereco.geo && [h.endereco.geo.x, h.endereco.geo.y, 100]
      );
      if (!coordinates) return;

      this.heatLayer = L.heatLayer(coordinates).addTo(this.map);
    },

    setMarkers(hospitais) {
      this.clearMarkers();
      for (let i in hospitais) {
        const h = hospitais[i];
        let mark = this.createMarker(
          h.id,
          h.endereco.geo.coordinates,
          h.status
        );
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

    clear(e) {
      this.updateMarker(e);
    },

    updateMarker(h) {
      let mark = {};
      if (h.status !== "NOVO") {
        let marker = this.markersGroup.getLayers().find(l => l._id === h.id);
        mark = this.createMarker(h.id, marker.getLatLng(), h.status);
        this.markersGroup.removeLayer(marker);
      } else {
        mark = this.createMarker(h.id, h.endereco.geo.coordinates, h.status);
      }
      this.markersGroup.addLayer(mark);
    },

    createMarker(id, latLng, status) {
      let mark = L.marker(latLng, {
        icon: this.icons[status]
      });
      mark._id = id;
      return mark;
    }
  }
};
</script>

<style lang="scss">
.flexgrid-container {
  .box,
  .basic-layout > div {
    // background-color: #f1f1f1;

    background-color: #18655b;
  }

  .basic-layout {
    margin: 0;

    height: 100vh;
  }

  .map {
    width: 100%;
    height: 100%;
    border-radius: 0.333rem;
  }

  .menu {
    background: #f1f1f1;
    padding: 2rem 1rem;
    border-radius: 0.333rem;
  }
  .logo {
    width: 50px;
    padding: 1rem 0;
  }
}
</style>