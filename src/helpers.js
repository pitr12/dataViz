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

function getImagePortion(imgObj, newWidth, newHeight, startX, startY, ratio) {
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


export const extractFixation = (data) => {
  return {
    id: data['FixationIndex'],
    length: parseFloat(data['GazeEventDuration']),
    x: Math.floor((parseFloat(data['GazePointLeftX (ADCSpx)']) + parseFloat(data['GazePointRightX (ADCSpx)'])) / 2),
    y: Math.floor((parseFloat(data['GazePointLeftY (ADCSpx)']) + parseFloat(data['GazePointRightY (ADCSpx)'])) / 2),
    name: data['ParticipantName']
  }
}
