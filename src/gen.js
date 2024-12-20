const faker = require("faker");
const got = require("got");
const LocateChrome = require("locate-chrome");
const puppeteer = require("puppeteer-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
const AnonymizeUAPlugin = require("puppeteer-extra-plugin-anonymize-ua");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const path = require("path");

// Local Imports
const {
  log,
  genPw,
  sleep,
  writeToFile,
  genNum,
  logWebhook,
  namaIdn,
  panjangIdn,
  getRandomFromArray,
} = require("./utils");

puppeteer.use(stealth());
puppeteer.use(AnonymizeUAPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

class GMAIL {
  constructor(
    sms,
    headless,
    api_key,
    discohook,
    discolog,
    maxRetries,
    retryDelay,
    recoverMail,
    recover,
    indonesia,
    lengthPw
  ) {
    this.browser = null;
    this.sms = sms;
    this.headless = headless;
    this.api_key = api_key;
    this.discohook = discohook;
    this.discolog = discolog;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.recoverMail = recoverMail;
    this.recover = recover;
    this.indonesia = indonesia;
    this.lengthPw = lengthPw;
  }

  async run() {
    try {
      await this.createAccount();
    } catch (e) {
      log(`[GOOGLE GEN] ---> ${e.message}`, "error");
      await logWebhook(
        `[GOOGLE GEN] ---> ${e.message}`,
        "error",
        this.discolog
      );
      if (this.phoneId) {
        await this.cancelPhone(this.phoneId);
      }
      throw e;
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  async nextTab(page) {
    let buttons = await page.$$("button");
    for (let b = 0; b < buttons.length; b++) {
      const buttonText = await (
        await buttons[b].getProperty("innerText")
      ).jsonValue();
      if (
        buttonText === "Skip" ||
        buttonText === "Next" ||
        buttonText === "Continue" ||
        buttonText === "Yes, I’m in" ||
        buttonText === "I agree"
      ) {
        await buttons[b].click();
        break;
      }
    }
  }

  async findAndClickSkip(page) {
    let buttons = await page.$$("button");
    for (let b = 0; b < buttons.length; b++) {
      const buttonText = await (
        await buttons[b].getProperty("innerText")
      ).jsonValue();
      if (buttonText === "Skip") {
        await buttons[b].click();
        break;
      }
    }
  }

  async createAccount() {
    log("[GOOGLE GEN] ---> Generating...", "info");
    await logWebhook("Starting the Gmail generator", "info", this.discolog);
    let first, last;

    if (this.indonesia === true) {
      first = getRandomFromArray(namaIdn);
      last = getRandomFromArray(panjangIdn);
    } else {
      first = faker.name.firstName();
      last = faker.name.lastName();
    }

    let mail = `${first}${last}${genNum()}`;
    this.email = mail;

    /* custom password example 
    this.password = "Your Password here"; // this is a string*/
    this.password = genPw(this.lengthPw);
    let browserConfig = {
      headless: this.headless,
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--enable-features=NetworkService",
      ],
      defaultViewport: { width: 1575, height: 1503, deviceScaleFactor: 1.25 },
      executablePath: await LocateChrome(),
    };
    this.browser = await puppeteer.launch(browserConfig);
    let page = (await this.browser.pages())[0];
    const headers = {
      "accept-language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    };
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1.25,
    });
    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders(headers);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
    );
    await page.goto("https://accounts.google.com/SignUp");
    await page.waitForSelector("#firstName");
    await page.type("#firstName", first.replace(/[^a-zA-Z0-9,]/g, ""));
    await page.type("#lastName", last.replace(/[^a-zA-Z0-9,]/g, ""));
    await page.click('span[jsname="V67aGc"]');
    await page.waitForTimeout(2500);
    await page.type("#day", "01");
    await page.type("#year", "1990");
    await page.select("#month", "1");
    await page.select("#gender", "1");
    await this.nextTab(page);
    await page.waitForTimeout(2500);
    let elements = await page.$$(".gyrWGe");
    for (let i = 0; i < elements.length; i++) {
      let innerText = await (
        await elements[i].getProperty("innerText")
      ).jsonValue();
      if (innerText === "Create your own Gmail address") {
        await elements[i].click();
        break;
      }
    }
    await page.waitForTimeout(2500);
    await page.type(
      'input[name="Username"]',
      this.email.replace(/[^a-zA-Z0-9,]/g, "")
    );
    await logWebhook(
      `Generated email ${this.email.toLocaleLowerCase()}@gmail.com`,
      "info",
      this.discolog
    );
    await this.nextTab(page);
    await page.waitForTimeout(5000);
    await page.type('input[name="Passwd"]', this.password.toString());
    await page.type('input[name="PasswdAgain"]', this.password.toString());
    await logWebhook(
      `Generated password ${this.password}`,
      "info",
      this.discolog
    );
    await this.nextTab(page);
    await page.waitForTimeout(10000);
    let checkErrorHtml = await page.content();
    if (
      checkErrorHtml.includes("Sorry, we could not create your Google Account.")
    ) {
      log("[GOOGLE GEN] ---> Temp. ban occurred. Retrying (10s)...", "error");
      await logWebhook(
        "[GOOGLE GEN] ---> Temp. ban occurred. Retrying (10s)...",
        "error",
        this.discolog
      );
      await this.browser.close();
      this.browser = null;
      await sleep(10000);
      this.run();
    } else {
      // SMSHub API
      let phoneData = await this.getPhoneNumber(); // Menggunakan API smshub.org
      if (phoneData && phoneData.number && phoneData.id) {
        let { number: phone, id } = phoneData; // Destrukturisasi untuk mengambil nomor dan ID
        this.phoneId = id;
        this.phoneNumber = phone;
        console.log(
          `Phone ID: ${this.phoneId}, Phone Number: ${this.phoneNumber}`
        );

        await page.type("#phoneNumberId", `+${phone}`);
        await this.nextTab(page);
        await sleep(10000);

        let phoneHtml = await page.content();
        const errorMessages = [
          "This phone number cannot be used for verification.",
          "This phone number has been used too many times",
        ];

        let phoneClipped = errorMessages.some((message) =>
          phoneHtml.includes(message)
        );

        // Jika nomor tidak valid, batalkan nomor dan dapatkan nomor baru tanpa mengulangi proses
        let counter = 0;
        while (phoneClipped && counter < this.maxRetries) {
          counter++;
          if (this.phoneId) {
            log(
              `[GOOGLE GEN] ---> ${this.phoneNumber} This phone number cannot be used for verification`,
              "info"
            );
            await logWebhook(
              `[GOOGLE GEN] ---> ${this.phoneNumber} This phone number cannot be used for verification`,
              "info",
              this.discolog
            );
            await this.cancelPhone(this.phoneId); // Membatalkan aktivasi jika gagal
          }

          // Dapatkan nomor baru dari SMSHub API
          log(`[GOOGLE GEN] ---> Trying with a new phone number...`, "warn");
          await logWebhook(
            `[GOOGLE GEN] ---> Trying with a new phone number...`,
            "warn",
            this.discolog
          );

          await sleep(3000);
          phoneData = await this.getPhoneNumber();
          if (phoneData && phoneData.number && phoneData.id) {
            let { number: newPhone, id: newPhoneId } = phoneData;
            this.phoneId = newPhoneId;
            this.phoneNumber = newPhone;
            console.log(
              `Phone ID: ${this.phoneId}, Phone Number: ${this.phoneNumber}`
            );

            await page.evaluate(() => {
              document.querySelector("#phoneNumberId").value = "";
            });
            await page.type("#phoneNumberId", `+${newPhone}`);
            await this.nextTab(page);
            await sleep(10000);

            phoneHtml = await page.content();
            phoneClipped = errorMessages.some((message) =>
              phoneHtml.includes(message)
            );
          } else {
            log("[GOOGLE GEN] ---> Failed to get a new phone number.", "error");
            break;
          }
        }

        if (counter >= this.maxRetries) {
          await this.cancelPhone(this.phoneId);
          log(
            `[GOOGLE GEN] ---> Max attempts reached. Stopping the process.`,
            "warn"
          );
          await logWebhook(
            `[GOOGLE GEN] ---> Max attempts reached. Stopping the process.`,
            "warn",
            this.discolog
          );
          await this.browser.close();
          this.browser = null;
        }

        if (!phoneClipped) {
          log(
            `[GOOGLE GEN] ---> ${this.phoneNumber} Waiting for SMS code...`,
            "info"
          );
          await logWebhook(
            `[GOOGLE GEN] ---> ${this.phoneNumber} Waiting for SMS code...`,
            "info",
            this.discolog
          );
          await page.waitForSelector("#code");

          let code = null;
          const maxRetries = 10; // Set a limit for retries
          let retryCount = 0;

          // Function to attempt checking SMS status
          const attemptCheckSms = async () => {
            try {
              let smsStatus = await this.checkSms(this.phoneId); // Check SMS status with the latest ID

              if (smsStatus && smsStatus.status === "OK") {
                return smsStatus.code; // Kembalikan kode yang valid
              } else if (smsStatus && smsStatus.status === "WAITING_RETRY") {
                log(
                  `[GOOGLE GEN] ---> Waiting for another SMS, last code: ${smsStatus.lastCode}`,
                  "info"
                );
              } else if (smsStatus && smsStatus.status === "ERROR") {
                log(
                  `[ERROR] ---> Error while checking SMS: ${smsStatus.code}`,
                  "error"
                );
                return false;
              } else {
                await sleep(3000);
              }
            } catch (error) {
              log(`[ERROR] ---> Unexpected error: ${error.message}`, "error");
              await sleep(3000);
            }

            return null;
          };

          while (code === null && retryCount < maxRetries) {
            code = await attemptCheckSms();
            if (code === false) break;
            retryCount++;
          }

          // If code is still null, retry by re-requesting OTP
          if (code === null) {
            await this.reOtpPhone(this.phoneId);
            retryCount = 0;

            while (code === null && retryCount < maxRetries) {
              code = await attemptCheckSms();
              if (code === false) break;
              retryCount++;
            }
          }

          if (code !== null) {
            log(`[GOOGLE GEN] ---> Verifying with code: ${code}`, "info");
            await logWebhook(
              `[GOOGLE GEN] ---> Verifying with code: ${code}`,
              "info",
              this.discolog
            );
            await page.type("#code", `${code}`);
            await this.nextTab(page);
            await page.waitForTimeout(5000);

            // Setelah verifikasi, lengkapi aktivasi dengan ID yang baru
            await this.finishPhone(this.phoneId); // Gunakan ID terbaru
          } else {
            log(`[GOOGLE GEN] ---> Failed to get a valid SMS code.`, "error");
          }
        }
      }

      // Recovery email?
      if (this.recoverMail === true) {
        await page.waitForSelector("#recoveryEmailId");
        await page.type("#recoveryEmailId", this.recover);
        await logWebhook(
          `[GOOGLE GEN] ---> Successfully adding recovery account!\nEmail: |||${this.recover}|||`,
          "success",
          this.discolog
        );
        await page.waitForTimeout(5000);
      } else {
        await this.findAndClickSkip(page);
        await page.waitForTimeout(5000);
      }

      // Add phone number?
      await this.nextTab(page);
      await page.waitForTimeout(5000);

      // Review your account info
      await this.nextTab(page);
      await page.waitForTimeout(5000);

      // Privacy and Terms
      await this.nextTab(page);
      await sleep(10000);
      await this.browser.close();

      log("[GOOGLE GEN] ---> Successfully generated account!", "success");
      log(
        `[GOOGLE GEN] ---> Email: ${this.email}@gmail.com\nPassword: ${this.password}`,
        "success"
      );
      await logWebhook(
        `[GOOGLE GEN] ---> Successfully generated account!\nEmail: ${this.email}@gmail.com\nPassword: ${this.password}\n`,
        "success",
        this.discolog
      );
      await this.sendDiscordWebhook(this.email, this.password);
      await writeToFile(
        path.join(__dirname, "..", "exports.txt"),
        `${this.email}@gmail.com|${this.password}|${this.recover}`
      );
    }
  }

  // webhook
  async sendDiscordWebhook(email, password) {
    const embedData = {
      username: "Google Account Generator",
      embeds: [
        {
          title: "New Google Account Generated!",
          description: `**Email**: ${email}\n**Password**: ${password}`,
          color: 3066993,
          footer: {
            text: "Generated by Bot",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await got.post(this.discohook, {
        json: embedData,
      });
      console.log("Webhook sent to Discord successfully!");
    } catch (error) {
      console.error("Failed to send webhook to Discord:", error);
    }
  }

  async getPhoneNumber(
    service = "go",
    operator = "",
    country = "6",
    maxPrice = "",
    currency = ""
  ) {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        const baseUrl = `https://smshub.org/stubs/handler_api.php`;

        const url = `${baseUrl}?api_key=${this.api_key}&action=getNumber&service=${service}&country=${country}`;

        const response = await got.get(url, {
          headers: {
            Accept: "text/plain",
          },
          responseType: "text",
        });

        const responseBody = response.body;
        if (response.body.startsWith("ACCESS_NUMBER")) {
          let [_, id, number] = response.body.split(":");
          return { id, number };
        } else if (responseBody.startsWith("NO_NUMBERS")) {
          log(
            `[GOOGLE GEN] ---> No numbers available, retrying... (Attempt ${
              attempt + 1
            })`,
            "warning"
          );

          await sleep(this.retryDelay);
          attempt++;
        } else {
          log(
            `[GOOGLE GEN] ---> Failed to get phone number: ${responseBody}`,
            "error"
          );
          throw new Error(responseBody);
        }
      } catch (error) {
        log(
          `[GOOGLE GEN] ---> Error in getPhoneNumber: ${error.message}`,
          "error"
        );
        throw error;
      }
    }
  }

  async checkSms(id) {
    try {
      const url = `https://smshub.org/stubs/handler_api.php?api_key=${this.api_key}&action=getStatus&id=${id}`;

      const response = await got.get(url, {
        headers: {
          Accept: "text/plain",
        },
        responseType: "text",
      });

      const responseBody = response.body;
      console.log(`[DEBUG] Response Body: ${responseBody}`); // Log the full response

      if (responseBody.startsWith("STATUS_OK")) {
        const code = responseBody.split(":")[1].trim(); // Trim any whitespace
        if (!code) {
          log(
            `[ERROR] ---> Received STATUS_OK but code is empty for ID ${id}`,
            "error"
          );
          return { status: "ERROR", code: null }; // Handle empty code case
        }
        return { status: "OK", code };
      } else if (responseBody === "STATUS_WAIT_CODE") {
        return { status: "WAITING" };
      } else if (responseBody.startsWith("STATUS_WAIT_RETRY")) {
        const lastCode = responseBody.split(":")[1]?.trim(); // Use optional chaining and trim
        return { status: "WAITING_RETRY", lastCode };
      } else if (responseBody === "STATUS_CANCEL") {
        return { status: "CANCELLED" };
      } else {
        throw new Error(`Unknown response: ${responseBody}`);
      }
    } catch (error) {
      log(
        `[GOOGLE GEN] ---> [smshub.org] ---> Failed checking SMS code: ${error.message}`,
        "error"
      );
      return { status: "ERROR", code: null }; // Return error status
    }
  }

  async finishPhone(id) {
    try {
      const url = `https://smshub.org/stubs/handler_api.php?api_key=${this.api_key}&action=setStatus&status=6&id=${id}`;

      const response = await got.get(url, {
        headers: {
          Accept: "text/plain",
        },
        responseType: "text",
      });

      const responseBody = response.body;

      if (responseBody === "ACCESS_ACTIVATION") {
        return {
          status: "SUCCESS",
          message: "Activation completed successfully",
        };
      } else {
        throw new Error(responseBody);
      }
    } catch (error) {
      log(
        `[GOOGLE GEN] ---> [smshub.org] ---> Failed finishing SMS activation: ${error.message}`,
        "error"
      );
    }
  }

  async cancelPhone(id) {
    try {
      const url = `https://smshub.org/stubs/handler_api.php?api_key=${this.api_key}&action=setStatus&status=8&id=${id}`;

      const response = await got.get(url, {
        headers: {
          Accept: "text/plain",
        },
        responseType: "text",
      });

      const responseBody = response.body;

      if (responseBody === "ACCESS_CANCEL") {
        return {
          status: "CANCELLED",
          message: "Activation canceled successfully",
        };
      } else {
        throw new Error(responseBody);
      }
    } catch (error) {
      log(
        `[GOOGLE GEN] ---> [smshub.org] ---> Failed canceling SMS activation: ${error.message}`,
        "error"
      );
    }
  }
  async reOtpPhone(id) {
    try {
      const url = `https://smshub.org/stubs/handler_api.php?api_key=${this.api_key}&action=setStatus&status=3&id=${id}`;

      const response = await got.get(url, {
        headers: {
          Accept: "text/plain",
        },
        responseType: "text",
      });

      const responseBody = response.body;

      if (responseBody === "ACCESS_RETRY_GET") {
        return {
          status: "RETRY_GET",
          message: "Activation reOtp successfully",
        };
      } else {
        throw new Error(responseBody);
      }
    } catch (error) {
      log(
        `[GOOGLE GEN] ---> [smshub.org] ---> Failed ReOtp: ${error.message}`,
        "error"
      );
      return {
        status: "ERROR",
        message: error.message,
      };
    }
  }

  // UTILS
  async scrollToBottom(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async getButtons(page) {
    let b = await page.$$("button");
    return b;
  }
}

module.exports = GMAIL;
