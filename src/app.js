import {
  extractFixation,
  createFixationCube,
  findMinMaxFixationDuration,
} from './helpers';

import {
  BASIC_CUBE_SIZE,
  GRID_SIZE,
} from './config';
import { setupGUI } from './gui';
import $ from 'jquery';

class App {
  constructor() {
    setupGUI();
    this.width = window.innerWidth - 25;
    this.height = window.innerHeight;
    this.loadData();
    this.environment = this.setupEnvironment();
    // this.setupContent();
    this.render();
  }

  loadData() {
    const sample = $.get('/src/data/visualizationData.tsv', (data) => {
      const results = Papa.parse(data, {
        header: true,
      });

      const [min, max] = findMinMaxFixationDuration(results.data);

      const filteredResults = results.data.map(data => extractFixation(data, min, max)).filter(res => (res.id && res.x && res.y));
      let lastCubePosition = -(GRID_SIZE/2);
      let lastCubeSize = BASIC_CUBE_SIZE;
      filteredResults.forEach(res => {
        const size = BASIC_CUBE_SIZE + BASIC_CUBE_SIZE * res.normalizedLength;
        const position = lastCubePosition + lastCubeSize/2 + size/2;
        this.addFixationCube(res, position, size);
        this.addFixationCubeBackground(size, position, 0x4AC948);
        lastCubePosition = position;
        lastCubeSize = size;
      });
    });
  }

  setupEnvironment() {
    const scene = new THREE.Scene();
    const camera = this.createCamera();
    const renderer = this.createRenderer();
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    const light = this.addLight(scene);
    document.getElementById('threeWrapper').appendChild( renderer.domElement );
    return {
      scene,
      camera,
      renderer,
      light,
      controls,
    };
  }

  createCamera() {
    const camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 2000 );
    camera.position.z = 150;
    camera.position.y = 150;
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

  addLight(scene) {
    var pointofLight = new THREE.PointLight( 0xffffff );

    pointofLight.position.x = 0;
    pointofLight.position.y = 0;
    pointofLight.position.z = 150;
    pointofLight.opacity = 300;

    scene.add(pointofLight);
    return pointofLight;
  }

  setupContent () {
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE/BASIC_CUBE_SIZE);
    this.environment.scene.add(grid);
  }

  addFixationCube = async(fixation, positionX, cubeSize) => {
    const cube = await createFixationCube(fixation, positionX, cubeSize)
    this.environment.scene.add( cube );
  }

  addFixationCubeBackground(cubeSize, cubePosition, color) {
    const geometry = new THREE.BoxGeometry( cubeSize, 0, BASIC_CUBE_SIZE * 5 );
    const material = new THREE.MeshBasicMaterial({color})
    const cube = new THREE.Mesh( geometry, material );
    cube.position.x = cubePosition;
    cube.position.y = 0;
    cube.position.z = 0;
    this.environment.scene.add( cube );
  }

  render = () => {
    const {scene, camera, renderer, light} = this.environment;
    requestAnimationFrame( this.render );
    light.position.copy( camera.getWorldPosition() );

    renderer.render(scene, camera);
  }
}

new App();
