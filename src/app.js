import {
  addNormalizedLength,
  findMinMaxDuration,
  splitFixationsAndSaccades,
  drawGazePlot,
  drwawStimulusImg,
  drawFixations,
  insertParam,
} from './helpers';
import { setupGUI, displayInfo } from './gui';
import { BASIC_CUBE_SIZE } from './config';

class App {
  constructor() {
    $('body').addClass("loading");
    this.width = $('#outerThreeWrapper').innerWidth();
    this.height = window.innerHeight;
    this.currentParticipant = 0;

    this.environment = this.setupEnvironment();
    this.loadData();
    this.render();
  }

  drawStimulusCanvas(fixations) {
    const wrapper = document.getElementById('stimulusWrapper');
    wrapper.setAttribute("style",`width: ${window.innerWidth}`);
    wrapper.setAttribute("style",`height: ${window.innerHeight - 25}`);
    drwawStimulusImg();
    drawGazePlot(fixations);
  }

  loadData = async() => {
    const files = [
      '/src/data/visualizationData1_complete.tsv',
      '/src/data/visualizationData2_complete.tsv',
    ];

    let i = 0;

    for (let file of files) {
      await $.get(file, (data) => {
        const results = Papa.parse(data, {
          header: true,
        });

        const [fixations, saccades] = splitFixationsAndSaccades(results.data);
        const [minFixation, maxFixation] = findMinMaxDuration(fixations);
        const normalizedFixations = addNormalizedLength(fixations, minFixation, maxFixation);
        const [minSaccade, maxSaccade] = findMinMaxDuration(saccades);
        const normalizedSaccades = addNormalizedLength(saccades, minSaccade, maxSaccade);

        this.environment.fixations[i] = normalizedFixations;
        this.environment.saccades[i] = normalizedSaccades;

        drawFixations(this.environment, i);
        i+= 1;
      });
    }
    this.drawStimulusCanvas(this.environment.fixations[0]);
    await setupGUI(this.environment);
    $('body').removeClass("loading");
  }

  setupEnvironment() {
    const scene = new THREE.Scene();
    const camera = this.createCamera();
    const renderer = this.createRenderer();
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    const light = this.addLight(scene);
    document.getElementById('threeWrapper').appendChild( renderer.domElement );

    const eventsControls = new EventsControls( camera, renderer.domElement );

    eventsControls.attachEvent( 'onclick', function(ec) {
        ec.focused.position.set(
          ec.focused.position.x,
          ec.focused.position.y,
          (ec.focused.position.z === (ec.focused.userData.positionZ * BASIC_CUBE_SIZE)
            ? (ec.focused.userData.positionZ * BASIC_CUBE_SIZE) + BASIC_CUBE_SIZE
            : (ec.focused.userData.positionZ * BASIC_CUBE_SIZE))
        );

        if (this.environment.objectDetail && this.environment.objectDetail !== ec.focused) {
          this.environment.objectDetail.position.z -= BASIC_CUBE_SIZE;
        }

        if (this.environment.objectDetail && this.environment.objectDetail === ec.focused) {
          this.environment.objectDetail = null;
        } else {
          this.environment.objectDetail = ec.focused;
        }

        if (ec.event.isRightClick) {
          this.environment.objectDetail = null;
          const selectedFixations = this.environment.selectedFixations[ec.focused.userData.participantID];

          if (selectedFixations) { //array already exists
            const index = _.indexOf(selectedFixations, ec.focused.userData.id);
            if (index >= 0) { //remove item
              this.environment.selectedFixations[ec.focused.userData.participantID] = _.without(selectedFixations, ec.focused.userData.id);
            } else { //add item
              this.environment.selectedFixations[ec.focused.userData.participantID].push(ec.focused.userData.id)
            }
          } else { //new array
            this.environment.selectedFixations[ec.focused.userData.participantID] = [ec.focused.userData.id];
          }
        }

        displayInfo(this.environment.objectDetail && this.environment.objectDetail.userData)

    }.bind(this, eventsControls));

    eventsControls.attachEvent( 'mouseOver', function () {
			this.container.style.cursor = 'pointer';
		});
    eventsControls.attachEvent( 'mouseOut', function () {
			this.container.style.cursor = 'auto';
		});


    return {
      scene,
      camera,
      renderer,
      light,
      controls,
      eventsControls,
      fixations: {},
      saccades: {},
      colors: ['#4AC948', '#e67e22'],
      objectDetail: null,
      mapping: {
        color: 'saccade',
        size: 'fixation',
      },
      selectedFixations: {},
    };
  }

  createCamera() {
    const camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 2000 );
    camera.position.z = 250;
    camera.position.y = 250;
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

  render = () => {
    const {scene, camera, renderer, light} = this.environment;
    requestAnimationFrame( this.render );
    light.position.copy( camera.getWorldPosition() );

    renderer.render(scene, camera);
  }
}

new App();
