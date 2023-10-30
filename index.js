const fs = require("fs");
const http = require("http");
const https = require("https");
const { Header } = require("./sample-request");
const { BaseURL, FileName, FileExtension, Cookie } = require("./config");

const getOptions = (bytesStart) => {
  return {
    headers: {
      ...Header,
      cookie: Cookie,
      range: `bytes=${bytesStart}-`,
    },
  };
};

function getFromHeader(response, key) {
  if (key in response.headers) {
    console.log(key + ": " + response.headers[key]);
    return response.headers[key];
  }
  console.log("Not found", key);
  return;
}

async function download(url, byteStart) {
  const proto = !url.charAt(4).localeCompare("s") ? https : http;

  let contentLength = 1000001;
  let contentRange = 1000001;

  const partPath = `./temp/${byteStart}.mp4`;
  const fileStream = fs.createWriteStream(partPath);

  return new Promise((resolve, reject) => {
    const request = proto.get(url, getOptions(byteStart), (response) => {
      console.log(response.headers);
      console.log("StatusMessage", response.statusMessage);

      contentLength = parseInt(getFromHeader(response, "content-length"));
      if (getFromHeader(response, "content-range") == null) {
        contentLength = 0;
      }

      response.pipe(fileStream);
    });

    fileStream.on("finish", () =>
      resolve({
        partPath: partPath,
        contentRange: contentRange,
        contentLength: contentLength,
      })
    );

    request.on("error", (err) => {
      console.log("Request error", err);
      fs.unlink(fileStream.path, () => reject(err));
    });

    fileStream.on("error", (err) => {
      console.log("File stream", err);
      fs.unlink(fileStream.path, () => reject(err));
    });

    request.end();
  });
}

async function downloadVideo(url, file) {
  let contentRange = 1;

  for (let i = 0; i < 70032019; ) {
    const data = await download(url, i).catch((error) =>
      console.error("Error downloading:", error)
    );
    contentRange = data.contentRange;

    if (data.contentLength != 0) {
      i += data.contentLength;

      const partData = fs.readFileSync(data.partPath);
      await file.write(partData);
      fs.unlinkSync(data.partPath);
    } else {
      i += 1;
    }
  }
}

// Call start
(async () => {
  const path = FileName + "." + FileExtension;

  fs.readdir("./temp", (err, files) => {
    if (err) {
      throw err;
    }
    for (const file of files) {
      fs.unlinkSync("./temp/" + file, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  });

  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
  const file = fs.createWriteStream(path);

  await downloadVideo(BaseURL, file);
  file.end();
  console.log("Download complete.");
})();
