const LocateChrome = require("locate-chrome");
const puppeteer = require("puppeteer-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
const AnonymizeUAPlugin = require("puppeteer-extra-plugin-anonymize-ua");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const fs = require("fs");
const chalk = require("chalk");

// Fungsi log sesuai tipe pesan
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

puppeteer.use(stealth());
puppeteer.use(AnonymizeUAPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function Check() {
  let browserConfig = {
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--enable-features=NetworkService",
    ],
    defaultViewport: { width: 1575, height: 1503, deviceScaleFactor: 1.25 },
    executablePath: await LocateChrome(),
  };

  // Launch the browser
  const browser = await puppeteer.launch(browserConfig);
  const page = (await browser.pages())[0];

  const headers = {
    "accept-language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  };

  // Configure page settings
  await page.setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1.25,
  });
  await page.setJavaScriptEnabled(true);
  await page.setExtraHTTPHeaders(headers);
  await page.setUserAgent(headers["User-Agent"]);

  // Navigate to the target URL
  await page.goto("https://gmailver.com/");
  await page.waitForTimeout(10000);
  await page.waitForSelector(".CodeMirror-scroll");

  // Read email credentials from the text file
  const emailData = fs.readFileSync("../GMAIL-Generator/exports.txt", "utf-8");
  const emailLines = emailData.split("\n");

  // Extract email addresses from the data
  const emails = emailLines
    .map((line) => {
      const [email] = line.split("|"); // Extract email
      return email;
    })
    .filter(Boolean); // Filter out empty lines

  await page.click(".CodeMirror-scroll");

  for (const email of emails) {
    await page.keyboard.type(email); // Input the email
    await page.keyboard.press("Enter"); // Simulate pressing Enter
  }

  await page.click("#check-btn");
  await page.waitForTimeout(5000);

  // Extract results from the page
  const results = await page.evaluate(() => {
    const spans = document.querySelectorAll(
      'div.CodeMirror-code span[role="presentation"]'
    );
    return Array.from(spans).map((span) => span.textContent);
  });

  // Log extracted results with colored output
  console.log("Hasil Pengecekan Email:");
  results.forEach((result) => {
    const [status, email] = result.split("|");

    // Tambahkan kondisi untuk memeriksa status undefined
    if (status !== undefined && email !== undefined) {
      if (status === "Good") {
        log(`Good|${email}`, "success");
      } else if (status === "Not_Exist") {
        log(`Disabled|${email}`, "warn");
      } else if (status === "Not_Exist") {
        log(`Not_Exist|${email}`, "warn");
      } else {
        log(`${status}|${email}`, "error");
      }
    }
  });

  // Menutup browser setelah proses
  await browser.close();
}

// Export the Check function
module.exports = Check;
