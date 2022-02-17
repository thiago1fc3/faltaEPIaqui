import { RestClient } from "./RestClient";

export const epis = new (class extends RestClient {
    constructor() {
        super("api/epis");
    }
})();