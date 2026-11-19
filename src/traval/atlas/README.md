# Traval 地图数据

地图边界取自 [chinese-global-compliant-geodata](https://github.com/JayMuShui/chinese-global-compliant-geodata/tree/3cf3485789876c37be6193bf2848cf9aaa40f758)，仓库附有 [MIT 许可证](./LICENSE)。上游列出的边界来源包括 [Surbowl 世界地图](https://github.com/Surbowl/world-geo-json-zh)、[天地图](https://www.tianditu.gov.cn/) 和 [GeoJSON.CN](https://geojson.cn/data/atlas/china)。

运行 `node scripts/build-traval-atlas.mjs` 可从固定版本重新生成地图。构建脚本将边界投影为 SVG 路径并按省打包下钻数据。地区 ID 供本地记录使用，更新数据时需保留现有 ID，或同时迁移已保存的地区代码。
