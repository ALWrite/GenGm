const chalk = require("chalk");
const password = require("secure-random-password");
const lockfile = require("proper-lockfile");
const fs = require("fs/promises");
const got = require("got");
const { title } = require("process");

const log = (message, type) => {
  switch (type) {
    case "info":
      console.log(chalk.blueBright(message));
      break;
    case "error":
      console.log(chalk.redBright(message));
      break;
    case "success":
      console.log(chalk.greenBright(message));
      break;
    case "warn":
      console.log(chalk.yellowBright(message));
      break;
    default:
      console.log(chalk.magenta(message));
  }
};

const logWebhook = async (message, type, webhookUrl) => {
  const embedColor = {
    info: 3447003,
    error: 15158332,
    success: 3066993,
    warn: 15844367,
    default: 10181046,
  };

  const currentTimestamp = Math.floor(Date.now() / 1000); // in seconds
  const formattedTimestamp = `<t:${currentTimestamp}:F>`;
  const embedData = {
    username: "Google Account Generator Log",
    embeds: [
      {
        title: formattedTimestamp,
        description: message,
        color: embedColor[type] || embedColor.default,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await got.post(webhookUrl, {
      json: embedData,
    });
  } catch (error) {
    console.error("Failed to send log to Discord webhook:", error.message);
  }
};

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const genPw = (length) => {
  length = typeof length === "number" && length > 0 ? length : 12;

  if (length < 8) {
    throw new Error("Min length is 8");
  }

  const minRequiredLength = 5;
  const characterSetsCount = 3;

  if (length < characterSetsCount + minRequiredLength) {
    throw new Error(
      `Length must be at least ${characterSetsCount + minRequiredLength}`
    );
  }

  let pw = password.randomPassword({
    length: length - minRequiredLength,
    characters: [password.lower, password.upper, password.digits],
  });

  let num = rNum(1000, 9999);
  pw = pw + "!" + num.toString();

  return pw;
};

// const genPw = (length) => {
//   length = typeof length === "number" && length > 0 ? length : 12;

//   const minRequiredLength = 5;

//   if (length < minRequiredLength) {
//     throw new Error(`Length must be at least ${minRequiredLength}`);
//   }

//   let pw = password.randomPassword({
//     length: length - minRequiredLength,
//     characters: [password.lower, password.upper, password.digits],
//   });

//   let num = rNum(1000, 9999);
//   pw = pw + "!" + num.toString();

//   return pw;
// };

// const genPw = () => {
//   let pw = password.randomPassword({
//     characters: [password.lower, password.upper, password.digits],
//   });
//   pw = pw.slice(0, pw.length - 5);
//   let num = rNum(1000, 9999);
//   pw = pw + "!" + num.toString();
//   pw += "Aa";
//   return pw;
// };

const rNum = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const pathExists = async (filePath) => {
  try {
    await fs.readFile(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

const writeToFile = async (filePath, content) => {
  const lockOptions = {
    retries: {
      retries: 100, // Number of retries
      factor: 3, // The exponential factor to use
      minTimeout: 1 * 1000, // The number of milliseconds before starting the first retry
      maxTimeout: 60 * 1000, // The maximum number of milliseconds between two retries
      randomize: true, // Randomizes the timeouts by multiplying with a factor between 1 to 2
    },
  };

  let release;
  try {
    let fileExists = await pathExists(filePath);
    if (!fileExists) {
      await fs.writeFile(filePath, ""); // Create an empty file
    }

    // Try to acquire the lock
    release = await lockfile.lock(filePath, lockOptions);
    await fs.appendFile(filePath, `${content}\n`);

    // Release the lock
    await release();
    release = null; // Set to null to avoid double release
  } catch (err) {
    log(`Error adding to file: ${err.message}`, "error");
  } finally {
    if (release) {
      // Make sure to release the lock if it was acquired but an error occurred
      await release();
    }
  }
};

// const genNum = () => {
//   return Math.floor(Math.random() * 3023);
// };

const genNum = () => {
  return Math.floor(Math.random() * 9000) + 1000;
};

let namaIdn = [
  "Andi",
  "Budi",
  "Citra",
  "Dewi",
  "Eko",
  "Fitri",
  "Gilang",
  "Hendra",
  "Intan",
  "Joko",
  "Kartika",
  "Lina",
  "Mira",
  "Nina",
  "Oki",
  "Putri",
  "Rani",
  "Santi",
  "Teguh",
  "Umi",
  "Vera",
  "Wawan",
  "Yuni",
  "Zaki",
  "Adi",
  "Bayu",
  "Cahyo",
  "Dian",
  "Edi",
  "Fauzan",
  "Gita",
  "Handoko",
  "Ika",
  "Johan",
  "Kiki",
  "Lukman",
  "Maya",
  "Nanda",
  "Omar",
  "Putu",
  "Rizky",
  "Siti",
  "Tri",
  "Usman",
  "Vika",
  "Winda",
  "Yoga",
  "Zul",
  "Arya",
  "Bening",
  "Cipta",
  "Desta",
  "Endang",
  "Fikri",
  "Gusti",
  "Heri",
  "Ina",
  "Juna",
  "Kirana",
  "Lutfi",
  "Mega",
  "Nova",
  "Omar",
  "Pertiwi",
  "Raka",
  "Siska",
  "Tari",
  "Ujang",
  "Vio",
  "Wahyu",
  "Yudha",
  "Zainal",
  "Anita",
  "Bintang",
  "Cinta",
  "Damar",
  "Eva",
  "Farhan",
  "Garin",
  "Hilman",
  "Irma",
  "Jefri",
  "Kusuma",
  "Latif",
  "Maudy",
  "Nuri",
  "Olga",
  "Putra",
  "Rima",
  "Surya",
  "Tirta",
  "Utami",
  "Vivi",
  "Wira",
  "Yayan",
  "Zahra",
];

let panjangIdn = [
  "Saputra",
  "Wijaya",
  "Santoso",
  "Pangestu",
  "Prasetyo",
  "Wibowo",
  "Setiawan",
  "Yunita",
  "Pratama",
  "Utami",
  "Haryono",
  "Rahmawati",
  "Suryadi",
  "Kusuma",
  "Nurhalim",
  "Saraswati",
  "Sudarmawan",
  "Gunawan",
  "Suhendra",
  "Rahardjo",
  "Mulyani",
  "Hardjono",
  "Iskandar",
  "Suprapto",
  "Sudarmono",
  "Anindita",
  "Utomo",
  "Nurhadi",
  "Cahyadi",
  "Rahman",
  "Firdaus",
  "Anggraini",
  "Hadi",
  "Purnomo",
  "Permana",
  "Mahardika",
  "Irawan",
  "Hasan",
  "Wulandari",
  "Basuki",
  "Putranto",
  "Sutrisno",
  "Puspitasari",
  "Murdiyanto",
  "Hidayat",
  "Wahjudi",
  "Sukardi",
  "Prabowo",
  "Iswahyudi",
  "Lestari",
  "Handayani",
  "Maulana",
  "Suryono",
  "Widyanto",
  "Sutanto",
  "Kurniawan",
  "Subakti",
  "Baskoro",
  "Purnamasari",
  "Hartono",
  "Pamungkas",
  "Susanto",
  "Fadilah",
  "Kusnadi",
  "Wibisono",
  "Wijono",
  "Wijaksana",
  "Sutarto",
  "Prakoso",
  "Hutama",
  "Nugroho",
  "Santika",
  "Muljono",
  "Saputro",
  "Surjono",
  "Adiputra",
  "Nirmala",
  "Raharjo",
  "Widyasari",
  "Nursalim",
  "Wahyuni",
  "Gunadi",
  "Prabowo",
  "Yulianto",
  "Nugrahadi",
  "Hermawan",
  "Suryani",
  "Adi",
  "Adinata",
  "Permadi",
  "Kartika",
  "Sumargo",
  "Wijanarko",
  "Sungkono",
  "Harmoko",
  "Putri",
  "Budiman",
  "Suharto",
  "Herlambang",
  "Tanjung",
];

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  log,
  logWebhook,
  sleep,
  genPw,
  writeToFile,
  genNum,
  namaIdn,
  panjangIdn,
  getRandomFromArray,
};
