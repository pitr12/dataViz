import { BASIC_CUBE_SIZE, GRID_SIZE } from './config';
import hsl from '@davidmarkclements/hsl-to-hex';

export const getThumbnail = async (src, newWidth, newHeight, startX, startY) => {
  const image = await getImage(src);
  const thumbnail = getImagePortion(image, newWidth, newHeight, startX, startY, 1);
  return thumbnail;
};

const getImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img);
        img.onerror = () => reject(img);
        img.src = url
    })
}

const getImagePortion = (imgObj, newWidth, newHeight, startX, startY, ratio) => {
  var tnCanvas = document.createElement('canvas');
  var tnCanvasContext = tnCanvas.getContext('2d');
  tnCanvas.width = newWidth;
  tnCanvas.height = newHeight;

  var bufferCanvas = document.createElement('canvas');
  var bufferContext = bufferCanvas.getContext('2d');
  bufferCanvas.width = imgObj.width;
  bufferCanvas.height = imgObj.height;
  bufferContext.drawImage(imgObj, 0, 0);

  tnCanvasContext.drawImage(bufferCanvas, startX, startY, newWidth * ratio, newHeight * ratio, 0, 0, newWidth, newHeight);
  return tnCanvas.toDataURL();
}


export const addNormalizedLength = (data, min, max) => {
  return data.map(item => ({
    ...item,
    normalizedLength: (parseFloat(item.length) - min) / (max-min),
  }));
}

export const createFixationCube = async(fixation, positionX, positionZ, cubeSize, cubeColor, participantID) => {
  const geometry = new THREE.BoxGeometry( cubeSize, BASIC_CUBE_SIZE, cubeSize );
  const img = await getThumbnail('src/assets/visualizationImage.png', 128, 128, fixation.x - 64, fixation.y - 64);
  const texture = new THREE.TextureLoader().load(img);
  const cubeMaterialArray = [];
  cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: cubeColor } ));
  cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: cubeColor } ));
  cubeMaterialArray.push(new THREE.MeshPhongMaterial( { map: texture } ));
  cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: cubeColor } ));
  cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: cubeColor } ));
  cubeMaterialArray.push(new THREE.MeshPhongMaterial( { color: cubeColor } ));
  var cubeMaterials = new THREE.MultiMaterial( cubeMaterialArray );
  const cube = new THREE.Mesh( geometry, cubeMaterials );

  let model = new THREE.Object3D();
  model.userData['name'] = fixation.name;
  model.userData['length'] = `${fixation.length} ms`;
  model.userData['timestamp'] = `${fixation.timeStamp} ms`;
  model.userData['id'] = fixation.id;
  model.userData['position'] = `x: ${fixation.x}, y: ${fixation.y}`;
  model.userData['positionZ'] = positionZ;
  model.userData['participantID'] = participantID;
  model.add(cube);
  model.position.set(positionX, BASIC_CUBE_SIZE/2, positionZ * BASIC_CUBE_SIZE);

  // cube.position.x = positionX;
  // cube.position.y = BASIC_CUBE_SIZE/2;
  // cube.position.z = positionZ * BASIC_CUBE_SIZE;
  return model;
}

export const findMinMaxDuration = (data) => {
  let min = parseFloat(data[0].length);
  let max = parseFloat(data[0].length);
  data.forEach(item => {
    const duration = parseFloat(item.length);
    if(duration < min) {
      min = duration;
    }
    if(duration > max) {
      max = duration;
    }
  });
  return [min, max];
}

export const splitFixationsAndSaccades = (data) => {
  const fixations = [];
  const saccades = [];

  let currFixationItems = [];
  let currId = 1;
  let isFixation = false;
  let nonFixationStart = null;

  data.forEach((item) => {
    if(item['GazeEventType'] === 'Fixation') {
      isFixation = true;
      if(isRowValid(item)) {
        currFixationItems.push(item);
      }
      if(nonFixationStart) {
        saccades.push({
          id: currId - 1,
          length: Math.ceil(Math.abs(parseInt(nonFixationStart) - parseInt(item['EyeTrackerTimestamp'])) / 1000)
        });
        nonFixationStart = null;
      }
    }else {
      if(isFixation) {
        const averageFixation = computeAverageFixation(currFixationItems);
        fixations.push(averageFixation);
        currFixationItems = [];
        currId += 1;
        nonFixationStart = item['EyeTrackerTimestamp']
        isFixation = false;
      }
    }
  });

  return [fixations, saccades];
}

const computeAverageFixation = (fixations) => {
  const xArr = [];
  const yArr = [];
  fixations.forEach((item) => {
    xArr.push(Math.floor((parseFloat(item['GazePointLeftX (ADCSpx)']) + parseFloat(item['GazePointRightX (ADCSpx)'])) / 2));
    yArr.push(Math.floor((parseFloat(item['GazePointLeftY (ADCSpx)']) + parseFloat(item['GazePointRightY (ADCSpx)'])) / 2));
  });

  return {
    id: fixations[0]['FixationIndex'],
    length: parseFloat(fixations[0]['GazeEventDuration']),
    name: fixations[0]['ParticipantName'],
    x: Math.floor(xArr.reduce(function(sum, a) { return sum + a },0)/(xArr.length||1)),
    y: Math.floor(yArr.reduce(function(sum, a) { return sum + a },0)/(yArr.length||1)),
    timeStamp: fixations[0]['RecordingTimestamp'],
    secondsTimeStamp: Math.ceil(fixations[0]['RecordingTimestamp'] / 1000),
  }
}

const isRowValid = (row) => {
  return (row['ValidityLeft'] === '0' && row['ValidityRight'] === '0');
}

export const heatMapColorforValue = (value) => {
  var h = (1.0 - value) * 240
  return hsl(h, 100, 50);
}

export const drwawStimulusImg = () => {
  const canvas = document.getElementById('stimulusCanvas');
  const ctx = canvas.getContext('2d');
  const img = document.getElementById("overallImage");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
}

export const drawGazePlot = (fixations) => {
  const canvas = document.getElementById('stimulusCanvas');
  const ctx = canvas.getContext('2d');
  fixations.forEach((item, index) => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, 20 + (30 * item.normalizedLength), 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font="20px Georgia";
    ctx.fillText(index + 1, item.x - 10, item.y + 5);
  });
}

export const clearCanvas = () => {
  const canvas = document.getElementById('stimulusCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export const filterFixations = (fixations, min, max) => {
  return fixations.filter(f => (f.secondsTimeStamp >= min && f.secondsTimeStamp <= max));
}

export const filterFixationsFromPanel = (fixations, min, selectedFixations, shouldFilterSelected) => {
  let result;
  if (shouldFilterSelected && !selectedFixations) {
    result = [];
  }else {
    result = fixations.filter(f => ((selectedFixations) ? (((f.length >= min)) && (_.indexOf(selectedFixations, f.id) >= 0)) : (f.length >= min)));
  }
  return result;
}

export const filterSaccades = (saccades, filteredFixations) => {
  const fIds = filteredFixations.map(f => parseInt(f.id));
  return saccades.filter(s => (_.contains(fIds, s.id)));
}

export const clearScene = (environment) => {
  const { scene, eventsControls} = environment;
  const objsToRemove = _.rest(scene.children, 1);
  _.each(objsToRemove, ( object ) => {
        scene.remove(object);
        eventsControls.detach(object);
  });
}

const addFixationCube = async(fixation, positionX, positionZ, cubeSize, cubeColor, environment, participantID) => {
  const cube = await createFixationCube(fixation, positionX, positionZ, cubeSize, cubeColor, participantID)
  environment.scene.add( cube );
  environment.eventsControls.attach(cube);
}

const addFixationCubeBackground = (cubeSize, cubePosition, positionZ, color, scene) => {
  const geometry = new THREE.BoxGeometry( cubeSize, 0, BASIC_CUBE_SIZE * 5 );
  const material = new THREE.MeshBasicMaterial({color})
  const cube = new THREE.Mesh( geometry, material );
  cube.position.x = cubePosition;
  cube.position.y = 0;
  cube.position.z = positionZ * BASIC_CUBE_SIZE;
  scene.add( cube );
}

export const drawFixations = (environment, participantID) => {
  const fixations = environment.fixations[participantID];
  const saccades = environment.saccades[participantID];

  let lastCubePosition = -(BASIC_CUBE_SIZE * 5);
  let lastCubeSize = BASIC_CUBE_SIZE;

  if (fixations.length === 0) {
    const position = lastCubePosition + lastCubeSize/2 + BASIC_CUBE_SIZE/2;
    addFixationCubeBackground(BASIC_CUBE_SIZE, position, participantID * 8, environment.colors[participantID], environment.scene);
  }else {
    fixations.forEach((fixation, i) => {
      const saccade = saccades[i];
      let color;
      let size;

      if (environment.mapping.color === 'saccade') {
        color = saccade ? parseInt(heatMapColorforValue(saccade.normalizedLength).replace(/^#/, ''), 16) : 0x21ff;
      } else {
        color = parseInt(heatMapColorforValue(fixation.normalizedLength).replace(/^#/, ''), 16);
      }

      if (environment.mapping.size === 'fixation') {
        size = BASIC_CUBE_SIZE + BASIC_CUBE_SIZE * fixation.normalizedLength;
      } else {
        size = saccade ? (BASIC_CUBE_SIZE + BASIC_CUBE_SIZE * saccade.normalizedLength) : BASIC_CUBE_SIZE;
      }


      const position = lastCubePosition + lastCubeSize/2 + size/2;
      addFixationCube(fixation, position, participantID * 8, size, color, environment, participantID);
      addFixationCubeBackground(size, position, participantID * 8, environment.colors[participantID], environment.scene);
      lastCubePosition = position;
      lastCubeSize = size;
    });
  }
}

export const drawFixationsForAll = (environment) => {
  clearScene(environment);
  for (var key in environment.fixations) {
     if (environment.fixations.hasOwnProperty(key)) {
        drawFixations(environment, key);
     }
  }
}
