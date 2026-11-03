const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { transform } = require("./svg-transformer.cjs");

const projectRoot = path.resolve(__dirname, "..");

for (const platform of ["web", "ios"]) {
  const options = { projectRoot, platform, dev: false, hot: false };

  test(`${platform}: delegates TypeScript to Expo's Babel transformer`, async () => {
    const result = await transform({
      src: "export const value: number = 42;",
      filename: path.join(projectRoot, "src", "transformer-check.ts"),
      options,
      plugins: [],
    });

    assert.equal(result.ast.type, "File");
    assert.ok(!JSON.stringify(result.ast).includes('"type":"TSNumberKeyword"'));
  });

  test(`${platform}: compiles a local SVG into a themed component`, async () => {
    const filename = path.join(projectRoot, "assets", "svg", "easyq", "home.svg");
    const result = await transform({
      src: readFileSync(filename, "utf8"),
      filename,
      options,
      plugins: [],
    });

    const ast = JSON.stringify(result.ast);
    assert.equal(result.ast.type, "File");
    assert.ok(ast.includes("react-native-svg"));
    assert.ok(ast.includes("currentColor"));
    // Expo's Babel pass lowers the default export to CommonJS.
    assert.ok(ast.includes('"name":"SvgHome"'));
    assert.ok(ast.includes('"name":"default"'));
  });
}
