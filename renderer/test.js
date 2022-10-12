
const express = require("express");
const path = require("path");
const createError = require("http-errors");
const checkRouter = require("./router/check");
const startRouter = require("./router/start");
const stopRouter = require("./router/stop");
const videoAnalysis = require("./router/video_analysis");
const getRtsp = require("./router/get_rtsp");
const axios = require("axios");

const app = express();
const server = app.listen(37658, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log("app listening at http://%s:%s", host, port);
});


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
global.cookie = "";

function getSession() {
  const params = JSON.stringify({
    username: "superuser",
    password: "Intel1980_user",
  });

  const config = {
    method: "post",
    url: `http://113.108.32.107:8088/login`,
    headers: {
      "Content-Type": "application/json",
    },
    data: params,
  };
  console.log('zkf', config);
  axios(config)
    .then((response) => {
      global.cookie =
        response.headers["set-cookie"] && response.headers["set-cookie"][0];
      console.log(
        `zkf-登录成功`,
        response.headers["set-cookie"],
        global.cookie
      );
      // 定时每半个小时获取新的cookie
      setTimeout(() => {
        getSession();
      }, 1000 * 60 * 10);
    })
    .catch((error) => {
      console.log(`zkf-登录失败，服务异常`);
      // 定时每半个小时获取新的cookie
      setTimeout(() => {
        getSession();
      }, 1000 * 60 * 10);
    });
}
getSession();


app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  // res.header("Content-Type", "application/json;charset=utf-8");
  // next();
  if(req.method.toLowerCase() == 'options')
        res.send(200); // 让options 尝试请求快速结束
    else
        next();
});

app.get("/localstream/video_analysis", videoAnalysis);
app.get("/localstream/check", checkRouter);
app.get("/localstream/start", startRouter);
app.get("/localstream/getrtsp", getRtsp);
app.get("/localstream/stop", stopRouter);
app.get("/localstream/status", (req, res) => {
  const { rtsp } = req.query;
  if (!rtsp) {
    res.send({
      status: 400,
      data: null,
      msg: "缺少rtsp参数",
    });
  } else {
    // 更新时间 代表客户端仍然在播放
    if (global.playObject[rtsp]) {
      global.playObject[rtsp] = {
        ...global.playObject[rtsp],
        time: new Date().getTime(),
      };
    }
    res.send({
      status: 200,
      data: global.playObject[rtsp]
        ? { ...global.playObject[rtsp], process: null }
        : null,
      msg: "success.",
    });
  }
});

app.use(express.static(path.join(__dirname, ".")));

app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(path.join(__dirname, ""));
});
