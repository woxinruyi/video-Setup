const axios = require("axios");

// 获取视频流请求 url:http://10.101.33.2:30021/api/intellif/devicecloud/1.0/stream/live,
// body:{"device_info":"44030753001320002338","auto_destroy":"true","stream_type":"all","device_type":"intellif_gb28181_server","id":"4798977","snapshot":"0"}
async function getRtspServer(international_code, camera_id) {
  return new Promise((resolve, reject) => {
    var config = {
      method: "get",
      url: `http://113.108.32.107:8088/api/intellif/devicecloud/1.0/stream/live?device_info=${international_code}&auto_destroy=true&stream_type=all&device_type=intellif_gb28181_server&id=${camera_id}&snapshot=0`,
      // headers: {},
      headers: { "Cache-Control": "no-cache" },
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
}
// async function getRtspServer(id) {
//   return new Promise((resolve, reject) => {
//     const data = JSON.stringify({
//       id,
//     });
//     console.log("zkf-global.cookie", global.cookie);
//     const config = {
//       method: "post",
//       url: "http://113.108.32.107:8088/iapp/camera/live",
//       headers: {
//         "Content-Type": "application/json",
//         "Cookie": global.cookie,
//       },
//       data: data,
//     };

//     axios(config)
//       .then(function (response) {
//         console.log(JSON.stringify(response.data));
//         resolve(response.data);
//       })
//       .catch(function (error) {
//         reject(error);
//       });
//   });
// }

module.exports = async function getRtsp(req, res) {
  const { international_code, camera_id } = req.query;
  console.log("zkf-getrtsp", international_code, camera_id);
  if (!camera_id) {
    res.send({
      status: 400,
      data: null,
      msg: "deviceid不能为空",
    });
    return;
  }
  try {
    const _res = await getRtspServer(international_code, camera_id);

    res.send({
      status: 200,
      data: { ..._res.data },
      msg: "check success.",
    });
  } catch (error) {
    res.send({
      status: 400,
      data: error && error.message,
      msg: "check error.",
    });
  }
};
