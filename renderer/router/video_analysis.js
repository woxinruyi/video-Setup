var axios = require('axios');

module.exports = async function videoAnalysis(req, res) {
  const { source_url, camera_id } = req.query;
  console.log('zkf-query', req.query);
  if (!camera_id) {
    res.send({
      status: 400,
      data: null,
      msg: "缺少camera_id参数",
    });
    return;
  }
  const _res = await stopAnalysis(camera_id);
  console.log('zkf-stop', _res);
  var data = JSON.stringify({
    source_url,
    "video_id": camera_id,
    "duration": -1,
    "count_duration": 30
  });
  var config = {
    method: 'post',
    url: 'http://113.108.32.107:8088/analysis/video_analysis',
    headers: {
      'Content-Type': 'application/json'
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    res.send({
      status: 200,
      data: response.data,
      msg: "success.",
    });
  })
  .catch(function (error) {
    console.log(error);
    res.send({
      status: 500,
      data: error,
      msg: "error.",
    });
  });
  
};
async function stopAnalysis(device_id) {
  console.log('zkf', device_id);
  return new Promise((resolve, reject)=>{
    var data = JSON.stringify({
      video_id: device_id,
    });
    var config = {
      method: 'post',
      url: 'http://113.108.32.107:8088/analysis/stop_analysis',
      headers: {
        'Content-Type': 'application/json'
      },
      data : data
    };
    
    axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      resolve(response.data);
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
  
};
