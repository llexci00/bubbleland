/* ============================================================
   단일 HTML 빌드 — index.html의 외부 CSS/JS를 전부 인라인해
   자체 완결형 bubbleland.html 한 파일로 합병한다.
   실행:  node build.js
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "bubbleland.html");

let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// CSS: <link rel="stylesheet" href="css/xxx.css" /> → <style>...</style>
html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g, (m, href) => {
  const css = fs.readFileSync(path.join(ROOT, href), "utf8");
  return `<style>\n${css}\n</style>`;
});

// JS: <script src="js/xxx.js"></script> → <script>...</script>
html = html.replace(/<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/g, (m, src) => {
  let js = fs.readFileSync(path.join(ROOT, src), "utf8");
  js = js.replace(/<\/script>/gi, "<\\/script>");   // 문자열 내 </script> 방어
  return `<script>\n${js}\n</script>`;
});

fs.writeFileSync(OUT, html, "utf8");
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✅ bubbleland.html 생성 완료 (${kb} KB) — 남은 외부참조:`,
  (html.match(/(?:href|src)=["'](?:css|js)\//g) || []).length);
