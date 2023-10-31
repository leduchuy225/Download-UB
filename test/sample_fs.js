const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { Header, Header2, Header3 } = require("../sample-request");

exports.donwloadFS = async (url, headers) => {
  await axios({
    url: url,
    method: "get",
    headers: headers,
    responseType: "stream",
  })
    .then(function (response) {
      return new Promise((resolve, reject) => {
        const filename = path.basename(url);
        const file = fs.createWriteStream(`${filename}.mp4`);
        response.data.pipe(file);

        file.on("error", (error) => {
          return reject(
            `There was an error writing the file. Details: $ {error}`
          );
        });

        file.on("finish", () => {
          file.close();
        });

        file.on("close", () => {
          return resolve(filename);
        });
      });
    })
    .catch(function (error) {
      console.log(error);
    });
};
