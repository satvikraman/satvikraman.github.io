import { readFileSync, writeFileSync } from "node:fs";

const source = new URL("../assets/data/portfolio.json", import.meta.url);
const target = new URL("../assets/portfolio-data.js", import.meta.url);
const data = JSON.parse(readFileSync(source, "utf8"));

writeFileSync(
  target,
  `<script>\nwindow.__PORTFOLIO_DATA__ = ${JSON.stringify(data)};\n</script>\n`,
  "utf8"
);
