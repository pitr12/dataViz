import { BASIC_CUBE_SIZE } from './config';

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


export const extractFixation = (data, min, max) => {
  return {
    id: data['FixationIndex'],
    length: parseFloat(data['GazeEventDuration']),
    normalizedLength: (parseFloat(data['GazeEventDuration']) - min) / (max-min),
    x: Math.floor((parseFloat(data['GazePointLeftX (ADCSpx)']) + parseFloat(data['GazePointRightX (ADCSpx)'])) / 2),
    y: Math.floor((parseFloat(data['GazePointLeftY (ADCSpx)']) + parseFloat(data['GazePointRightY (ADCSpx)'])) / 2),
    name: data['ParticipantName']
  }
}

export const createFixationCube = async(fixation, positionX, cubeSize) => {
  const geometry = new THREE.BoxGeometry( cubeSize, BASIC_CUBE_SIZE, cubeSize );
  const img = await getThumbnail('src/assets/visualizationImage.png', 128, 128, fixation.x, fixation.y);
  const texture = new THREE.TextureLoader().load(img);
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
  cube.position.y = BASIC_CUBE_SIZE/2;
  cube.position.z = 0;
  return cube;
}

export const findMinMaxFixationDuration = (data) => {
  let min = parseFloat(data[0]['GazeEventDuration']);
  let max = parseFloat(data[0]['GazeEventDuration']);
  data.forEach(item => {
    const duration = parseFloat(item['GazeEventDuration']);
    if(duration < min) {
      min = duration;
    }
    if(duration > max) {
      max = duration;
    }
  });
  return [min, max];
}
