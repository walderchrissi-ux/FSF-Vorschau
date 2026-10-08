// Freunde schenken Freude – 3D-Logo auf der Startseite
// Zeigt zuerst das gerenderte Bild; wenn WebGL verfügbar ist, wird es
// durch das echte 3D-Logo ersetzt. Es pendelt sanft und folgt der Maus leicht.
import * as THREE from './three.module.js';
import { SVGLoader } from './SVGLoader.js';
import { RoomEnvironment } from './RoomEnvironment.js';

const rahmen = document.querySelector('.logo3d');
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

function glaettePunkte(punkte, abstand = 7, durchgaenge = 14) {
  const linie = new THREE.Shape(punkte);
  const n = Math.max(24, Math.round(linie.getLength() / abstand));
  let p = linie.getSpacedPoints(n).slice(0, -1);
  for (let d = 0; d < durchgaenge; d++) {
    p = p.map((pt, i) => {
      const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length];
      return new THREE.Vector2((a.x + 2 * pt.x + b.x) / 4, (a.y + 2 * pt.y + b.y) / 4);
    });
  }
  return p;
}
function glaetten(form) {
  const neu = new THREE.Shape(glaettePunkte(form.getPoints(24)));
  neu.holes = form.holes.map(h => new THREE.Path(glaettePunkte(h.getPoints(24))));
  return neu;
}

async function start() {
  const canvas = rahmen.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; }   // kein WebGL: Bild bleibt stehen
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const szene = new THREE.Scene();
  szene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const kamera = new THREE.PerspectiveCamera(25, 1, 10, 20000);

  const haupt = new THREE.DirectionalLight(0xffffff, 2.2); haupt.position.set(-900, 1400, 1600); szene.add(haupt);
  const kante = new THREE.DirectionalLight(0xf2f5ff, 1.6); kante.position.set(1300, 1100, -1500); szene.add(kante);
  const fuell = new THREE.DirectionalLight(0xffffff, 0.3); fuell.position.set(0, -900, 1800); szene.add(fuell);

  const svg = await (await fetch(rahmen.dataset.svg)).text();
  const daten = new SVGLoader().parse(svg);
  const logo = new THREE.Group();
  let nr = 0;
  for (const pfad of daten.paths) {
    const farbe = new THREE.Color().setStyle(pfad.userData.style.fill || '#ffffff');
    const material = new THREE.MeshPhysicalMaterial({ color: farbe, roughness: 0.34, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.6 });
    const staffel = [0, -14, 10][nr++ % 3];
    for (const roh of SVGLoader.createShapes(pfad)) {
      const geo = new THREE.ExtrudeGeometry(glaetten(roh), { depth: 110, bevelEnabled: true, bevelThickness: 22, bevelSize: 16, bevelSegments: 6, curveSegments: 4 });
      geo.computeVertexNormals();
      const netz = new THREE.Mesh(geo, material);
      netz.position.z = staffel;
      logo.add(netz);
    }
  }
  logo.scale.y = -1;
  const box = new THREE.Box3().setFromObject(logo);
  logo.position.sub(box.getCenter(new THREE.Vector3()));
  const groesse = box.getSize(new THREE.Vector3());
  const halter = new THREE.Group(); halter.add(logo); szene.add(halter);
  const grundwinkel = -20 * Math.PI / 180;
  halter.rotation.y = grundwinkel;

  function anpassen() {
    const w = rahmen.clientWidth, h = rahmen.clientHeight;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    // Abstand so wählen, dass das Logo mit etwas Luft genau hineinpasst
    const halbeHoehe = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
    const noetig = Math.max(groesse.y * 1.12 / 2 / halbeHoehe, groesse.x * 1.12 / 2 / (halbeHoehe * kamera.aspect));
    kamera.position.set(0, noetig * 0.16, noetig);
    kamera.lookAt(0, 0, 0);
    kamera.updateProjectionMatrix();
  }
  anpassen();
  new ResizeObserver(anpassen).observe(rahmen);

  // Maus leicht folgen (nur Geräte mit Maus)
  let zielX = 0, zielY = 0;
  if (matchMedia('(pointer: fine)').matches && !ruhig) {
    addEventListener('pointermove', e => {
      zielY = (e.clientX / innerWidth - 0.5) * 0.5;
      zielX = (e.clientY / innerHeight - 0.5) * 0.18;
    }, { passive: true });
  }

  // nur zeichnen, wenn sichtbar
  let sichtbar = true;
  new IntersectionObserver(([e]) => { sichtbar = e.isIntersecting; }).observe(rahmen);

  const uhr = new THREE.Clock();
  let ersterFrame = true;
  (function schleife() {
    requestAnimationFrame(schleife);
    if (!sichtbar && !ersterFrame) return;
    const t = uhr.getElapsedTime();
    const pendel = ruhig ? 0 : Math.sin(t * 2 * Math.PI / 9) * 0.22;
    halter.rotation.y += (grundwinkel + pendel + zielY - halter.rotation.y) * 0.05;
    halter.rotation.x += (zielX - halter.rotation.x) * 0.05;
    renderer.render(szene, kamera);
    if (ersterFrame) { ersterFrame = false; rahmen.classList.add('bereit'); }
  })();
}

if (rahmen) start().catch(() => {});
