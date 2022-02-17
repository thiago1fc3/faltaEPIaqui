<template>
  <div class="flexgrid-container">
    <navbar></navbar>
    <div class="p-grid basic-layout">
      <div id="container-filter" class="container-filter">
        <div
          class="open-close"
          @click="openCloseFilter()"
          :style="open ? 'right: 20px' : 'right: -10px'"
        >
          <i v-show="open" class="pi pi-chevron-left"></i>
          <i v-show="!open" class="pi pi-chevron-right"></i>
        </div>
        <div class="menu">
          <div>
            <div class="header-menu">
              <h4>Filtre sua pesquisa</h4>
              <div class="open-close" @click="openCloseFilter()" :style="open ? '' : 'position:absolute;right: 0;top:20px'">
                <i v-show="open" class="pi pi-chevron-left"></i>
                <i v-show="!open" class="pi pi-chevron-right"></i>
              </div>
            </div>
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
          <div style="padding-bottom:50px">
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
      </div>

      <div id="container-mapa" class="container-map">
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
import navbar from "@/components/navbar.vue";

import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import { API_URL } from "@/config";

export default {
  components: {
    Checkbox,
    InfoHospital,
    InputText,
    navbar
  },
  data() {
    return {
      open: true,
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
      evtSource: null,
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
    if (!this.$oauth.isAuthenticated) {
      this.$toast.warning("Você não está autenticado. Por favor, faça login.");
      this.$router.push("/login");
    }

    // close filter if width window < 600px
    if (window.innerWidth < 600) {
      document.getElementById("container-filter").style.width = "20px";
      document.getElementById("container-mapa").style.width =
        "calc(100% - 20px)";
      this.open = false;
    }

    this.map = L.map("map").setView([-3.71664, -38.5423], 6);
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

    this.evtSource = new EventSource(`${API_URL}api/stream/web`);
    this.evtSource.onmessage = this.onMessageHandler;
    this.evtSource.onerror = this.onErrorHandler;
  },
  watch: {
    "window.innerWidth": () => {
      if (window.innerWidth < 600) {
        document.getElementById("container-filter").style.width = "20px";
        document.getElementById("container-mapa").style.width =
          "calc(100% - 20px)";
        this.open = false;
      }
    }
  },
  methods: {
    openCloseFilter() {
      let filter = document.getElementById("container-filter");
      let mapa = document.getElementById("container-mapa");

      if (this.open) {
        filter.style.width = "20px";
        mapa.style.width = "calc(100% - 20px)";
        this.open = !this.open;
      } else {
        if (window.innerWidth <= 600) {
          filter.style.width = "80%";
          mapa.style.width = "20%";
        } else if (window.innerWidth <= 992) {
          filter.style.width = "40%";
          mapa.style.width = "60%";
        } else {
          filter.style.width = "25%";
          mapa.style.width = "75%";
        }
        this.open = !this.open;
      }
    },
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
    },

    onMessageHandler(e) {
      let event = JSON.parse(e.data);
      if (event) {
        this.updateMarker(event.data);
        this.map.fitBounds(this.markersGroup.getBounds());
      }
    },

    onErrorHandler(e) {
      switch (e.target.readyState) {
        case EventSource.CONNECTING:
          break;
        case EventSource.CLOSED:
          this.evtSource = new EventSource(`${API_URL}api/stream/web`);
          this.evtSource.onmessage = this.onMessageHandler;
          this.evtSource.onerror = this.onErrorHandler;
          break;
      }
    }
  }
};
</script>

<style lang="scss">
.flexgrid-container {
  .box,
  .basic-layout > div {
    background-color: #18655b;
  }

  .basic-layout {
    margin: 0;
    height: 100vh;

    .container-filter {
      display: block;
      position: relative;
      padding: 0;
      padding-bottom: 20px;
      overflow: hidden;
      transition: width 0.2s;
      width: 20px;
    }
    .container-map {
      display: block;
      position: relative;
      padding: 0;
      transition: width 0.2s;
      width: calc(100% - 20px);
    }
    @media (max-width: 992px) {
      .container-filter {
        width: 40%;
      }
      .container-map {
        width: 60%;
      }
    }
    @media (max-width: 600px) {
      .container-filter {
        width: 80%;
      }
      .container-map {
        width: 20%;
      }
    }
    @media (min-width: 992px) {
      .container-filter {
        width: 25%;
      }
      .container-map {
        width: 75%;
      }
    }
  }

  .map {
    width: 100%;
    height: calc(100vh - 50px);
  }

  .menu {
    background: #f1f1f1;
    padding: 20px;
    height: calc(100vh - 50px);
    overflow-y: auto;
    overflow-x: hidden;

    .header-menu {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 0;
      margin-bottom: 20px;

      .open-close {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
      h4 {
        font-weight: normal;
        margin: 0;
      }
    }
  }
}
</style>