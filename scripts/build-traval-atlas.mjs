import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const revision = "3cf3485789876c37be6193bf2848cf9aaa40f758";
const source = `https://raw.githubusercontent.com/JayMuShui/chinese-global-compliant-geodata/${revision}`;
const china = "src/geojson/countries/as/chn";
const output = new URL("../src/traval/atlas/", import.meta.url);
const input = process.argv[2];

async function readSource(name, path) {
  if (input) return readFile(join(input, `traval-${name}.tmp`), "utf8");
  const response = await fetch(`${source}/${path}`);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.text();
}

const files = {
  world: "src/geojson/globe/world.json",
  provinces: `${china}/global/chn-level-1.json`,
  cities: `${china}/global/chn-level-2.json`,
  districts: `${china}/global/chn-level-3.json`,
  taiwan: `${china}/region/tw/chn-tw-level-2.json`,
};
const [entries, license] = await Promise.all([
  Promise.all(Object.entries(files).map(async ([name, path]) => (
    [name, JSON.parse(await readSource(name, path)).features]
  ))),
  readSource("license", "LICENSE"),
]);
const data = Object.fromEntries(entries);
const radians = Math.PI / 180;
const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
const provinceNames = [
  "Beijing", "Tianjin", "Hebei", "Shanxi", "Inner Mongolia", "Liaoning", "Jilin",
  "Heilongjiang", "Shanghai", "Jiangsu", "Zhejiang", "Anhui", "Fujian", "Jiangxi",
  "Shandong", "Henan", "Hubei", "Hunan", "Guangdong", "Guangxi", "Hainan",
  "Chongqing", "Sichuan", "Guizhou", "Yunnan", "Tibet", "Shaanxi", "Gansu",
  "Qinghai", "Ningxia", "Xinjiang", "Taiwan", "Hong Kong", "Macao",
];
const otherRegions = {
  "索马里兰": ["somaliland", "Somaliland"],
  "北塞浦路斯": ["northern-cyprus", "Northern Cyprus"],
  "锡亚琴冰川": ["siachen", "Siachen Glacier"],
  "阿什莫尔和卡捷群岛": ["ashmore-cartier", "Ashmore and Cartier Islands"],
};

// Equal Earth for the globe, Albers with 25° and 47° standard parallels for China.
function projectWorld([lon, lat]) {
  const theta = Math.asin(Math.sqrt(3) * Math.sin(lat * radians) / 2);
  const squared = theta * theta;
  const sixth = squared ** 3;
  const a = 1.340264, b = -0.081106, c = 0.000893, d = 0.003796;
  return [
    2 * Math.sqrt(3) * lon * radians * Math.cos(theta) / (3 * (a + 3 * b * squared + sixth * (7 * c + 9 * d * squared))),
    -theta * (a + b * squared + sixth * (c + d * squared)),
  ];
}

const albersN = (Math.sin(25 * radians) + Math.sin(47 * radians)) / 2;
const albersC = Math.cos(25 * radians) ** 2 + 2 * albersN * Math.sin(25 * radians);
function projectChina([lon, lat]) {
  const radius = Math.sqrt(albersC - 2 * albersN * Math.sin(lat * radians)) / albersN;
  const angle = albersN * (lon - 105) * radians;
  return [radius * Math.sin(angle), radius * Math.cos(angle)];
}

function bounds(points) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const [x, y] of points) {
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return [left, top, right, bottom];
}

function rings({ geometry }) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry ${geometry.type}`);
}

function area(ring) {
  let sum = 0;
  let [previousX, previousY] = ring.at(-1);
  for (const [x, y] of ring) {
    sum += previousX * y - x * previousY;
    previousX = x;
    previousY = y;
  }
  return Math.abs(sum / 2);
}

// Preserve each ring and reduce redundant points in the rendered coordinate space.
function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  const keep = new Set([0, points.length - 1]);
  const pending = [[0, points.length - 1]];
  while (pending.length) {
    const [start, end] = pending.pop();
    const [x, y] = points[start];
    const dx = points[end][0] - x;
    const dy = points[end][1] - y;
    const span = dx * dx + dy * dy;
    let furthest = -1;
    let limit = tolerance * tolerance;
    for (let i = start + 1; i < end; i++) {
      const [px, py] = points[i];
      const pos = span && Math.max(0, Math.min(1, ((px - x) * dx + (py - y) * dy) / span));
      const distance = (px - x - pos * dx) ** 2 + (py - y - pos * dy) ** 2;
      if (distance > limit) {
        furthest = i;
        limit = distance;
      }
    }
    if (furthest !== -1) {
      keep.add(furthest);
      pending.push([start, furthest], [furthest, end]);
    }
  }
  return keep.size >= 4 ? points.filter((_, index) => keep.has(index)) : points;
}

function marker(ring) {
  const [left, top, right, bottom] = bounds(ring);
  let point = [(left + right) / 2, (top + bottom) / 2];
  let widest = 0;
  for (const fraction of [0.5, 0.38, 0.62, 0.25, 0.75]) {
    const y = top + (bottom - top) * fraction;
    const hits = [];
    for (let i = 0, last = ring.length - 1; i < ring.length; last = i++) {
      const [x1, y1] = ring[last], [x2, y2] = ring[i];
      if ((y1 > y) !== (y2 > y)) hits.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      if (hits[i + 1] - hits[i] <= widest) continue;
      widest = hits[i + 1] - hits[i];
      point = [(hits[i] + hits[i + 1]) / 2, y];
    }
  }
  return point.map(Math.round);
}

function makeMap(regions, project, lines = []) {
  const projected = regions.map(({ id, feature }) => ({ id, rings: rings(feature).map(ring => ring.map(project)) }));
  const projectedLines = lines.flatMap(feature => feature.geometry.coordinates.map(line => line.map(project)));
  const [left, top, right, bottom] = bounds([...projected.flatMap(shape => shape.rings), ...projectedLines].flat());
  const scale = 800 / Math.max(right - left, bottom - top);
  const padding = 17;
  const position = ([x, y]) => [padding + (x - left) * scale, padding + (y - top) * scale];
  function path(points, close) {
    const rounded = simplify(points.map(position), 0.65).map(point => point.map(Math.round).join(" "));
    const distinct = rounded.filter((point, index) => point !== rounded[index - 1]);
    if (new Set(distinct).size < (close ? 3 : 2)) return "";
    return `M${distinct[0]}L${distinct.slice(1).join(" ")}${close ? "Z" : ""}`;
  }
  const shapes = projected.map(shape => {
    const [largest] = shape.rings.toSorted((a, b) => area(b) - area(a));
    const size = area(largest) * scale * scale;
    const [x, y] = marker(largest.map(position));
    return { id: shape.id, d: shape.rings.map(ring => path(ring, true)).join(""), x, y, small: size < 27, size };
  }).sort((a, b) => b.size - a.size);
  return {
    width: Math.ceil((right - left) * scale + padding * 2),
    height: Math.ceil((bottom - top) * scale + padding * 2),
    shapes: shapes.map(({ size, small, ...shape }) => small ? { ...shape, small } : shape),
    ...(lines.length ? { boundary: projectedLines.map(line => path(line, false)).join("") } : {}),
  };
}

const polygonFeatures = features => features.filter(({ geometry }) => ["Polygon", "MultiPolygon"].includes(geometry.type));
const world = polygonFeatures(data.world).map(feature => {
  const { name, full_name, iso_a2 } = feature.properties;
  const [id, en] = otherRegions[name] ?? [iso_a2, regionNames.of(iso_a2) ?? name];
  return { id, zh: name, en, ...(name !== full_name && { alias: full_name }), feature };
});
const provinces = polygonFeatures(data.provinces).map((feature, index) => ({
  id: feature.properties.gb.slice(3),
  zh: feature.properties.full_name,
  en: provinceNames[index],
  feature,
}));
const byProvince = new Map(provinces.map(province => [province.zh, province]));
const taiwanNames = new Map(data.taiwan.map(({ properties }) => [properties.gb, properties.name_en]));
const places = new Map(provinces.map(province => [province.id, province]));
for (const feature of [...polygonFeatures(data.cities), ...polygonFeatures(data.districts)]) {
  const { gb, full_name, province, city } = feature.properties;
  const id = gb.slice(3);
  if (places.has(id)) continue;
  const parent = byProvince.get(province);
  if (!parent) throw new Error(`No province for ${gb} ${full_name}`);
  const cityId = `${id.slice(0, 4)}00`;
  const codedCity = places.get(cityId);
  const namedCity = city && [...places.values()].find(place => place.parent === parent.id && place.zh === city);
  const parentId = namedCity?.id ?? codedCity?.id ?? parent.id;
  places.set(id, { id, zh: full_name, en: taiwanNames.get(gb), parent: parentId, feature });
}

await mkdir(output, { recursive: true });
function write(path, value) {
  return writeFile(new URL(path, output), `${JSON.stringify(value)}\n`);
}
const children = Map.groupBy([...places.values()].filter(place => place.parent), place => place.parent);
const provinceLoaders = [];
for (const province of provinces) {
  const groups = {};
  const cities = children.get(province.id) ?? [];
  if (!cities.length) continue;
  groups[province.id] = makeMap(cities, projectChina);
  for (const city of cities) {
    const districts = children.get(city.id);
    if (districts?.length) groups[city.id] = makeMap(districts, projectChina);
  }
  const name = province.id.slice(0, 2);
  await write(`${name}.json`, groups);
  provinceLoaders.push(`  "${name}": () => import("./${name}.json"),`);
}
const lines = data.provinces.filter(feature => feature.geometry.type === "MultiLineString");
const allPlaces = [...world, ...places.values()];
if (new Set(allPlaces.map(place => place.id)).size !== allPlaces.length) throw new Error("Duplicate place IDs");
await Promise.all([
  write("places.json", allPlaces.map(({ feature, ...place }) => place)),
  write("world.json", makeMap(world, projectWorld)),
  write("china.json", makeMap(provinces, projectChina, lines)),
  writeFile(new URL("loaders.ts", output), `// Generated by scripts/build-traval-atlas.mjs.\nimport type { MapGeometry } from "../places";\n\nexport const provinceLoaders: Record<string, () => Promise<{ default: Record<string, MapGeometry> }>> = {\n${provinceLoaders.join("\n")}\n};\n`),
  writeFile(new URL("LICENSE", output), license),
]);
