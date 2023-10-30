const fs = require("fs");
const https = require("https");

https
  .get(
    "https://user-images.githubusercontent.com/11889052/263643733-80d01d2f-677b-4399-ad8b-f7af9bb62b72.mp4",
    (response) => {
      let data = Buffer.from([]);

      response.on("data", (chunk) => {
        data = Buffer.concat([data, Buffer.from(chunk)]);
      });

      // The whole responseonse has been received. Print out the result.
      response.on("end", () => {
        fs.writeFile("./video.mp4", data, (err) => console.log(err));
      });
    }
  )
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
