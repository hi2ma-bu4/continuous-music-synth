import "./styles/main.css";

import { ProceduralOrchestraApp } from "./app/ProceduralOrchestraApp";

const mount = document.getElementById("app");

if (!(mount instanceof HTMLDivElement)) {
	throw new Error("The #app mount point is missing.");
}

const app = new ProceduralOrchestraApp(mount);

app.initialize();
