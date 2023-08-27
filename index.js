const fs = require("fs");
const http = require("http");
const https = require("https");
const { BaseURL, FileName, FileExtension, Cookie } = require("./config");

const file = fs.createWriteStream(FileName + "." + FileExtension);

let promises = [];
let contentRange = 0;
let contentLength = 0;

const options = {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    range: `bytes=${contentLength}-`,
    "sec-ch-ua":
      '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "video",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "same-site",
    cookie: Cookie,
    Referer: "https://ub.net/",
  },
};

async function download(url) {
  const proto = !url.charAt(4).localeCompare("s") ? https : http;

  const partPath = `./temp/${contentLength}.tmp`;
  const fileStream = fs.createWriteStream(partPath);

  return new Promise((resolve, reject) => {
    const request = proto.get(url, options, (response) => {
      if ("content-range" in response.headers && contentRange == 0) {
        contentRange = parseInt(response.headers["content-range"]);
        console.log(`Content-Range: ${contentRange}`);
      } else {
        console.log("Content-Range header not present in the response.");
      }

      if ("content-length" in response.headers) {
        contentLength += parseInt(response.headers["content-length"]);
        console.log(`Content-Length: ${contentLength}`);
      } else {
        console.log("Content-Length header not present in the response.");
      }

      response.pipe(fileStream);

      // response.on("end", () => {
      //   console.log(`Part ${partNumber} downloaded.`);
      //   resolve(partPath);
      // });
    });

    // The destination stream is ended by the time it's called
    fileStream.on("finish", () => resolve(partPath));

    request.on("error", (err) => {
      console.log(err);
      fs.unlink(fileStream.path, () => reject(err));
    });

    fileStream.on("error", (err) => {
      console.log(err);
      fs.unlink(fileStream.path, () => reject(err));
    });

    request.end();
  });
}

while (true) {
  promises.push(download(BaseURL));
  if (contentLength >= contentRange) {
    break;
  }
}

Promise.all(promises)
  .then((partPaths) => {
    partPaths.forEach((partPath) => {
      const partData = fs.readFileSync(partPath);
      file.write(partData);
      fs.unlinkSync(partPath); // Remove temporary part file
    });
    file.end();
    console.log("Download complete.");
  })
  .catch((error) => {
    console.error("Error downloading:", error);
  });
