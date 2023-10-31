const fs = require("fs");
const https = require("https");

exports.donwloadBuffer = async (url, header) => {
  https
    .get(url, { headers: header }, (response) => {
      console.log(response.statusCode);
      console.log(response.statusMessage);

      let data = Buffer.from([]);

      response.on("data", (chunk) => {
        console.log(chunk);

        data = Buffer.concat([data, Buffer.from(chunk)]);
        fs.writeFile("./video.mp4", data, (err) => console.log(err));
      });

      // The whole responseonse has been received. Print out the result.
      response.on("end", () => {
        fs.writeFile("./video.mp4", data, (err) => console.log(err));
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
};
