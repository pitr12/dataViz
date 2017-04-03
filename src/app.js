import {
  getThumbnail,
  extractFixation,
} from './helpers';
import { setupGUI } from './gui';
var $ = require("jquery");
require('./jquery.csv.js');
var fs = require('fs');

class App {
  constructor() {
    setupGUI();
    this.width = window.innerWidth - 25;
    this.height = window.innerHeight;

    this.loadData();

    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    const controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    document.getElementById('threeWrapper').appendChild( this.renderer.domElement );
    this.setupContent();
    this.light = this.addLight();
    this.render();
  }

  loadData() {
    const sample = $.get('/src/data/visualizationData.tsv', (data) => {
      const results = Papa.parse(data, {
        header: true,
      });

      const filteredResults = results.data.map(data => extractFixation(data)).filter(res => (res.id && res.x && res.y));
      let i = 1;
      filteredResults.forEach(res => {
        console.log(res);
        this.addFixationCube(res, -60 + i*2 );
        i += 1;
      });
      // console.log(filteredResults[0]);
    });
  }

  addFixationCube = async(fixation, positionX) => {
    console.log(positionX);
    const geometry = new THREE.BoxGeometry( 2, 2, 2 );
    const img = await getThumbnail('src/assets/visualizationImage.png', 128, 128, fixation.x, fixation.y);
    const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load(img);
    const cubeMaterialArray = [];
    cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: 0x2ecc71 } ));
    cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: 0x2ecc71 } ));
    cubeMaterialArray.push(new THREE.MeshPhongMaterial( { map: texture } ));
    cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: 0x2ecc71 } ));
    cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: 0x2ecc71 } ));
    cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: 0x2ecc71 } ));
    var cubeMaterials = new THREE.MultiMaterial( cubeMaterialArray );
    const cube = new THREE.Mesh( geometry, cubeMaterials );
    cube.position.x = positionX;
    cube.position.y = 1;
    cube.position.z = 0;
    this.scene.add( cube );
  }

  createCamera() {
    const camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 1000 );
    camera.position.z = 50;
    camera.position.y = 50;
    return camera;
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(this.width, this.height);
    return renderer;
  }

  addLight() {
    var pointofLight = new THREE.PointLight( 0xffffff );

    pointofLight.position.x = 0;
    pointofLight.position.y = 0;
    pointofLight.position.z = 50;
    pointofLight.opacity = 300;

    this.scene.add(pointofLight);
    return pointofLight;
  }

  setupContent () {
    const grid = new THREE.GridHelper(100, 20);
    this.scene.add(grid);
  }

  render() {
    requestAnimationFrame( this.render.bind(this) );
    this.light.position.copy( this.camera.getWorldPosition() );

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
