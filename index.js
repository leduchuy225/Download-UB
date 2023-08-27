const fs = require("fs");
const http = require("http");
const https = require("https");
const { BaseURL, FileName, FileExtension, Cookie } = require("./config");

const getOptions = (bytesStart) => {
  return {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      range: `bytes=${bytesStart}-`,
      "sec-ch-ua":
        '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "video",
      "sec-fetch-mode": "no-cors",
      "sec-fetch-site": "same-site",
      cookie: Cookie,
      Referer: "https://ub.net/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  };
};

async function download(url, byteStart) {
  const proto = !url.charAt(4).localeCompare("s") ? https : http;

  let contentLength = 1000001;

  const partPath = `./temp/${byteStart}.mp4`;
  // const fileStream = fs.createWriteStream(partPath);
  const fileStream = fs.createWriteStream(FileName + "." + FileExtension);

  return new Promise((resolve, reject) => {
    const request = proto.get(url, getOptions(byteStart), (response) => {
      if ("content-length" in response.headers) {
        contentLength = parseInt(response.headers["content-length"]);
      } else {
        console.log("Content-Length header not present in the response.");
      }

      response.pipe(fileStream);

      response.on("end", () => {
        resolve({ contentLength: contentLength, partPath: partPath });
      });
    });

    // fileStream.on("finish", () =>
    //   resolve({ contentLength: contentLength, partPath: partPath })
    // );

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

async function downloadVideo(url) {
  const file = fs.createWriteStream(FileName + "." + FileExtension);

  const downloadPromises = [];

  const bytesStart = 0;
  // const chunkSize = 1000001;
  const contentRange = 70032019;

  for (let i = bytesStart; i < contentRange; ) {
    const data = await download(url, i);
    i += data.contentLength;
  }

  // Promise.sequence(downloadPromises)
  //   .then((partPaths) => {
  //     partPaths.forEach((partPath) => {
  //       const partData = fs.readFileSync(partPath);
  //       file.write(partData);
  //       fs.unlinkSync(partPath); // Remove temporary part file
  //     });
  //     file.end();
  //     console.log("Download complete.");
  //   })
  //   .catch((error) => {
  //     console.error("Error downloading:", error);
  //   });
}

downloadVideo(BaseURL);
