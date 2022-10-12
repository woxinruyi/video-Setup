function getQueryVariable(variable) {
  const query = window.location.search.substring(1);
  const params = query.split("&");
  for (let i = 0; i < params.length; i++) {
    const pair = params[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}

window.videoport = null;
window.rtspUrl = null;
window.ratio = null;
window.scriptTime = null;
window.intervalTime = 3000;
window.execTime = 10000;
window.streamMsg = '';
window.streamMsgCount = 0;
window.international_code = null;
window.camera_id = null;
window.document.domain = 'localhost'
window.videoStatues = {};//状态信息


window.addEventListener("DOMContentLoaded", () => {
  const preStatus = document.getElementById("pre-status");
  const loadStatus = document.getElementsByClassName("start-loading")[0];

  window.buttonClick = function (type) {
    const rtsp = document.getElementById("inputValue").value;
    if (rtsp) {
      window.location.href = `${window.location.origin}?rtsp=${rtsp}`;
    }
  };

  window.rtspUrl = getQueryVariable("rtsp");
  window.ratio = getQueryVariable("ratio");
  window.international_code = getQueryVariable("international_code");
  window.camera_id = getQueryVariable("camera_id");

  function getRtsp() {
    if (!international_code || !camera_id) {
      return;
    }
    loadStatus.classList.add("block");
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        if (this.responseText) {
          const { data } = JSON.parse(this.responseText);
          console.log('zkf-data', data);
          if (data && data.liveUrlList) {
            getVideoAnalysis(data.liveUrlList.rtsp);
          } else {
            destroyVideo();
          }
        }
      }
    });

    xhr.open(
      "GET",
      `http://${window.location.hostname || "localhost"
      }:37654/localstream/getrtsp?international_code=${international_code}&camera_id=${camera_id}`
    );
    xhr.send();
  }
  function getVideoAnalysis(rtsp) {
    loadStatus.classList.add("block");
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        if (this.responseText) {
          const { data } = JSON.parse(this.responseText);
          console.log('zkf-data', data);
          if (data) {
            const output_url = data.output_url;
            getCheck(output_url)
          } else {
            destroyVideo();
          }
        }
      }
    });

    xhr.open(
      "GET",
      `http://${window.location.hostname || "localhost"
      }:37654/localstream/video_analysis?source_url=${rtsp}&camera_id=${camera_id}`
    );
    xhr.send();
  }
  function getCheck(rtsp) {
    window.rtspUrl = rtsp || getQueryVariable("rtsp");
    if (!rtspUrl) {
      return;
    }
    if (rtspUrl.substr(0, 4) !== "rtsp") {
      alert("仅支持rtsp协议的视频流");
      return;
    }
    loadStatus.classList.add("block");
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        if (this.responseText) {
          const { data } = JSON.parse(this.responseText);
          videoport = data.port;
          if (data) {
            playControl("start", rtspUrl);
          } else {
            destroyVideo();
          }
        }
      }
    });

    xhr.open(
      "GET",
      `http://${window.location.hostname || "localhost"
      }:37654/localstream/check?rtsp=${rtspUrl}&ratio=${ratio}`
    );

    xhr.send();
  }

  function playControl(type, _rtsp) {
    const rtsp = _rtsp;
    if (!rtsp && type === "start") {
      alert("请输入正确的rtsp地址");
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        if (type === "start") {
          render();
        }
      }
    });

    xhr.open(
      "GET",
      `http://${window.location.hostname || "localhost"
      }:37654/localstream/${type}?rtsp=${rtsp}`
    );
    xhr.send();
  }

  function getStatus() {
    if (rtspUrl) {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
          // 如果上次执行时间大于5s则认为是待机后恢复请求，此时服务端可能已经注销拉流进程，需要刷新页面激活
          if (window.scriptTime && new Date().getTime() - window.scriptTime > execTime) {
            window.location.reload();
          }
          // 成功时记录执行时间
          window.scriptTime = new Date().getTime();
          if (this.responseText) {
            const { data } = JSON.parse(this.responseText);
            // window.videoStatues=this.responseText;
            // console.log("获取前置值", window.videoStatues)
            window.videoStatues[`${rtspUrl}`] = this.responseText;
            // console.log("获取更改后的值", window.videoStatues)
            if (!data) {
              destroyVideo();
              return;
            }
            if (data.message && data.message == window.streamMsg) {
              window.streamMsgCount += 1;
            } else {
              window.streamMsgCount = 0;
            }
            if (window.streamMsgCount > 5) {
              window.location.reload();
            }
            if (data.status && !data.error) {
              preStatus.classList.remove("block");
              loadStatus.classList.remove("block");
            } else if (data.error || data.stop) {
              destroyVideo("取流异常，请重试。");
              // console.log(this.responseText, new Date());
            }
          } else {
            destroyVideo();
          }
        }
      });

      xhr.open(
        "GET",
        `http://${window.location.hostname || "localhost"
        }:37654/localstream/status?rtsp=${rtspUrl}`
      );

      /*
        定时和主程序发起通信
          */
      xhr.send();
    }
    setTimeout(getStatus, intervalTime);
  }

  function render() {
    if (!window.rtspUrl) {
      return;
    }
    preStatus.classList.remove("block");
    // var canvas = document.getElementById("video-canvas");
    // if (!canvas) {
    console.log("zkf-render");
    canvas = document.createElement("canvas");
    canvas.setAttribute("id", "video-canvas");
    const first = document.body.firstChild; //得到页面的第一个元素
    document.body.insertBefore(canvas, first);
    // }
    var url = `ws://${window.location.hostname || "localhost"}:${videoport + 1
      }/`;
    window.jsplayer = new JSMpeg.Player(url, {
      canvas: canvas,
      preserveDrawingBuffer: true,
    });
    iFrameEventMessage();//执行跨IFrame通信
  }

  function iFrameEventMessage() {
    window.addEventListener('message', (e) => {
      // console.log("获取当前状态信息", window.videoStatues);
      // if (event.origin !== "http://localhost:10002") return;
      if (e.data) {
        if (e.data.type === "ImageGet") {
          // e.source.postMessage('截屏信息', e.origin);
          let currentImage = getBase64();
          window.parent.postMessage({ imageBase64: currentImage, message: "截屏图片", currentVideo: e.data.currentVideo, type: 1 }, e.origin);
        }
        if (e.data.type === "RadioStatus") {
          // e.source.postMessage('获取状态信息',window.videoStatues);
          // let currentImage=getBase64();
          window.parent.postMessage({ message: "状态信息", currentVideoStatues: window.videoStatues, type: 2 }, e.origin);
        }
      }
    })
  }
  //获取截图数据
  function getBase64() {
    const canvas = document.createElement('canvas');
    let playerTargetDom;
    try {
      playerTargetDom = document.getElementsByTagName('canvas')?.[0]
    } catch (error) {
      console.log("截图失败", error);
    }
    // console.log("获取对应节点", playerTargetDom)
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    // @ts-ignore
    playerTargetDom &&
      ctx &&
      ctx.drawImage(
        playerTargetDom,
        0,
        0,
        500,
        300,
      );
    const base64 = canvas.toDataURL('image/jpeg');
    return base64;
  }

  function destroyVideo(msg) {
    if (!window.jsplayer) return;
    window.jsplayer && window.jsplayer.destroy();
    window.jsplayer = null;
    rtspUrl = null;
    preStatus.classList.add("block");
    loadStatus.classList.remove("block");
    document.getElementsByClassName("start-title")[0].innerHTML =
      msg || "未推流，请调用start接口启动";
  }
  if (camera_id && international_code) {
    getRtsp()
  } else {
    getCheck();
  }
  getStatus();
});
