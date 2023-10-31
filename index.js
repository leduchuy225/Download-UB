const fs = require("fs");
const http = require("http");
const https = require("https");
const { Header3 } = require("./sample-request");

const name = "Release1.mp4";
const url =
  "https://ub.net/khoa-hoc/studying/luyen-thi-ngan-hang-chinh-sach-xa-hoi-2023?ls=15691";

const getOptions = (bytesStart) => {
  return { headers: { ...Header3, range: `bytes=${bytesStart}-` } };
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

  let contentRange = 0;
  let contentLength = 1000001;

  const partPath = `./temp/${byteStart}.mp4`;
  const fileStream = fs.createWriteStream(partPath);

  return new Promise((resolve, reject) => {
    const request = proto.get(url, getOptions(byteStart), (response) => {
      console.log(response.headers);
      console.log("StatusMessage", response.statusMessage);

      contentLength = parseInt(getFromHeader(response, "content-length"));
      if (getFromHeader(response, "content-range") == null) {
        contentLength = 0;
      } else {
        contentRange = getFromHeader(response, "content-range").split("/")[1];
      }

      response.pipe(fileStream);
    });

    fileStream.on("finish", () => {
      resolve({
        partPath: partPath,
        contentRange: contentRange,
        contentLength: contentLength,
      });
    });

    request.on("error", (err) => {
      console.log("Request error", err);
      fs.unlink(fileStream.path, () => reject(err));
    });

    fileStream.on("error", (err) => {
      console.log("File stream", err);
      fs.unlink(fileStream.path, () => reject(err));
    });
  });
}

async function downloadVideo(url, file) {
  let maxValue = 1;
  for (let i = 0; i < maxValue; ) {
    const data = await download(url, i).catch((error) =>
      console.error("Error downloading:", error)
    );
    maxValue = parseInt(data.contentRange);

    if (data.contentLength != 0) {
      i += data.contentLength;

      const partData = fs.readFileSync(data.partPath);
      await file.write(partData);
      fs.unlinkSync(data.partPath);
    } else {
      throw "Có lỗi xảy ra";
    }
  }
}

// Call start
(async () => {
  const path = name;

  fs.readdir("./temp", (err, files) => {
    if (err) {
      throw err;
    }
    for (const file of files) {
      fs.unlinkSync("./temp/" + file);
    }
  });

  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }

  console.log(path);
  const file = fs.createWriteStream(path);

  https.get(
    url,
    {
      headers: {
        ...Header3,
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
      },
    },
    (response) => {
      response.on("data", async function (chunk) {
        const pattern_ubp_token = /window.ubp_token=([^;]+);/g;
        const pattern_ubp_fp = /window.ubp_fp=([^;]+);/g;
        const pattern_ubp_vv = /window.ubp_vv=([^;]+);/g;
        const pattern_ubp_vc = /window.ubp_vc=([^;]+);/g;

        const ubp_token = findByPattern(chunk, pattern_ubp_token);
        const ubp_fp = findByPattern(chunk, pattern_ubp_fp);
        const ubp_vv = findByPattern(chunk, pattern_ubp_vv);
        const ubp_vc = findByPattern(chunk, pattern_ubp_vc);

        if (ubp_fp && ubp_token && ubp_vc && ubp_vv) {
          const videoSrc =
            "https://ss.ub.net/video?token=" +
            ubp_token +
            "&vv=" +
            ubp_vv +
            "&vc=" +
            ubp_vc +
            "&fp=" +
            ubp_fp;

          console.log(videoSrc);
          await downloadVideo(videoSrc, file).then(() => {
            file.end();
            console.log("Download complete.");
          });
        }
      });
    }
  );
})();

function findByPattern(data, pattern) {
  let match;
  while ((match = pattern.exec(data)) !== null) {
    // The value is captured in the first capturing group (match[1])
    const value = match[1];
    console.log("Found value:", value);
    return value.replace(/'/g, "");

    // Exit the loop after the first match
  }
}
