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

class CEPAT {
  constructor(
    sms,
    headless,
    api_key_cepat,
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
    this.api_key = api_key_cepat;
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
      let phoneData = await this.getPhoneNumber();
      if (phoneData && phoneData.number && phoneData.order_id) {
        let { number: phone, order_id } = phoneData;
        this.phoneId = order_id;
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
            await this.cancelPhone(this.phoneId);
          }

          log(`[GOOGLE GEN] ---> Trying with a new phone number...`, "warn");
          await logWebhook(
            `[GOOGLE GEN] ---> Trying with a new phone number...`,
            "warn",
            this.discolog
          );

          await sleep(3000);
          phoneData = await this.getPhoneNumber();
          if (phoneData && phoneData.number && phoneData.order_id) {
            let { number: newPhone, order_id: newPhoneId } = phoneData;
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
          const maxRetries = 50;
          let retryCount = 0;

          const attemptCheckSms = async () => {
            try {
              const smsStatus = await got.get(
                `https://otpcepat.org/api/handler_api.php?api_key=${this.api_key}&action=get_status&order_id=${this.phoneId}`,
                { responseType: "json" }
              );

              const smsData = smsStatus.body?.data;
              const smsText = smsStatus.body.data.sms;
              const statusC = smsStatus.body.data.status;
              console.log(`[INFO] ---> Body ${JSON.stringify(smsData)}`);
              console.log(
                `[INFO] ---> OTP ${smsText}\n[INFO] ---> STATUS ${statusC}`
              );

              if (statusC === "Received") {
                console.log(
                  `[INFO] ---> SMS received with code: ${smsData.sms}`
                );
                return smsText;
              } else if (statusC === "Waiting SMS") {
                console.log(`[INFO] ---> Waiting for SMS...`);
              } else if (statusC === "Cancelled") {
                console.error(`[ERROR] ---> SMS request was cancelled.`);
                return false;
              } else {
                console.warn(
                  `[WARNING] ---> Unexpected SMS status: ${
                    smsData.status || "Unknown"
                  }`
                );
              }
            } catch (error) {
              console.error(
                `[ERROR] ---> Failed to check SMS status: ${error.message}`
              );
            }

            await sleep(10000);
            return null;
          };

          while (retryCount < maxRetries) {
            code = await attemptCheckSms();
            if (code === false) break;

            retryCount++;
          }

          if (code) {
            console.log(`[GOOGLE GEN] ---> Verifying with code: ${code}`);
            await logWebhook(
              `[GOOGLE GEN] ---> Verifying with code: ${code}`,
              "info",
              this.discolog
            );

            await page.waitForSelector("#code");
            await page.type("#code", code);
            await this.nextTab(page);
            await page.waitForTimeout(5000);

            await this.finishPhone(this.phoneId);
          } else {
            console.error(
              `[GOOGLE GEN] ---> Failed to get a valid SMS code after ${maxRetries} attempts. Closing browser.`
            );
            await this.cancelPhone(this.phoneId);
            await this.browser.close();
            this.browser = null;
          }
        }
      }

      // Recovery email?
      if (this.recoverMail === true) {
        await page.waitForSelector("#recoveryEmailId");
        await page.type("#recoveryEmailId", this.recover);
        await logWebhook(
          `[GOOGLE GEN] ---> Successfully adding recovery account!\nEmail: ||${this.recover}||`,
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
    operator_id = "random",
    service_id = "160",
    country_id = "6",
    maxPrice = "",
    currency = ""
  ) {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        const baseUrl = `https://otpcepat.org/api/handler_api.php`;

        const url = `${baseUrl}?api_key=${this.api_key}&action=get_order&operator_id=${operator_id}&service_id=${service_id}&country_id=${country_id}`;

        const response = await got.get(url, {
          headers: {
            Accept: "application/json",
          },
          responseType: "json",
        });

        const responseBody = response.body;
        if (responseBody.status === true) {
          const { order_id, number, price, status } = responseBody.data;
          if (status === "Waiting SMS") {
            return { order_id, number };
          } else {
            log(
              `[OTPCEPAT GEN] ---> Unexpected status: ${status} (Attempt ${
                attempt + 1
              })`,
              "warning"
            );
          }
        } else {
          log(
            `[OTPCEPAT GEN] ---> No numbers available or other error, retrying... (Attempt ${
              attempt + 1
            })`,
            "warning"
          );
        }

        await sleep(this.retryDelay);
        attempt++;
      } catch (error) {
        log(
          `[OTPCEPAT GEN] ---> Error in getPhoneNumber: ${error.message}`,
          "error"
        );
        throw error;
      }
    }

    await sleep(10000);
    await this.browser.close();
  }

  // async checkSms(order_id) {
  //   let endPoint = `https://otpcepat.org/api/handler_api.php?api_key=${this.api_key}&action=get_status&order_id=${order_id}`;
  //   let checkEnd = await got.get(endPoint);

  //   let ress = checkEnd.body;
  //   if (checkEnd.body.data.status === "true") {
  //     return (code = checkEnd.body.data.sms);
  //   }
  // }

  async finishPhone(order_id) {
    try {
      const url = `https://otpcepat.org/api/handler_api.php?api_key=${this.api_key}&action=set_status&order_id=${order_id}&status=4`;

      const response = await got.get(url, {
        headers: {
          Accept: "application/json",
        },
        responseType: "json",
      });

      const responseBody = response.body;

      if (responseBody.status === "true") {
        return {
          status: "SUCCESS",
          message: "Activation completed successfully",
        };
      } else {
        throw new Error(responseBody.msg || "Failed to finish activation");
      }
    } catch (error) {
      log(
        `[OTPCEPAT GEN] ---> Failed finishing SMS activation: ${error.message}`,
        "error"
      );
      return {
        status: "ERROR",
        message: error.message,
      };
    }
  }

  async cancelPhone(order_id) {
    try {
      const url = `https://otpcepat.org/api/handler_api.php?api_key=${this.api_key}&action=set_status&order_id=${order_id}&status=2`;

      const response = await got.get(url, {
        headers: {
          Accept: "application/json",
        },
        responseType: "json",
      });

      const responseBody = response.body;
      console.info(responseBody);

      if (responseBody.status === "true") {
        return {
          status: "CANCELLED",
          message: "Activation canceled successfully",
        };
      } else {
        throw new Error(responseBody.msg);
      }
    } catch (error) {
      log(`[OTPCEPAT GEN] ---> ${error.message}`, "info");
      return {
        status: "ERROR",
        message: error.message,
      };
    }
  }

  // async reOtpPhone(order_id) {
  //   try {
  //     const url = `https://otpcepat.org/api/handler_api.php?api_key=${this.api_key}&action=set_status&order_id=${order_id}&status=3`;

  //     const response = await got.get(url, {
  //       headers: {
  //         Accept: "application/json",
  //       },
  //       responseType: "json",
  //     });

  //     const responseBody = response.body;

  //     if (responseBody.status === "true") {
  //       return {
  //         status: "RETRY_GET",
  //         message: "Activation resend request successful",
  //       };
  //     } else {
  //       throw new Error(responseBody.msg || "Failed to resend SMS");
  //     }
  //   } catch (error) {
  //     log(
  //       `[OTPCEPAT GEN] ---> Failed re-sending SMS: ${error.message}`,
  //       "error"
  //     );
  //     return {
  //       status: "ERROR",
  //       message: error.message,
  //     };
  //   }
  // }

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

module.exports = CEPAT;
