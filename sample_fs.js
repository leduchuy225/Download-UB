const fs = require("fs");
const path = require("path");
const axios = require("axios");

function downloader(url) {
  axios({
    method: "get",
    url: url,
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
      // handle error
      console.log(error);
    });
  // .then(function (filename) {
  //   callback(filename);
  // });
}

downloader(
  "https://user-images.githubusercontent.com/11889052/263643733-80d01d2f-677b-4399-ad8b-f7af9bb62b72.mp4"
);
