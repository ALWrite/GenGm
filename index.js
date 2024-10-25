const readline = require("readline");
const gmailModule = require("./src/gen");
const chalk = require("chalk");
const figlet = require("figlet");
const Check = require("./src/check");
const { log, sleep, logWebhook } = require("./src/utils");

const {
  amount,
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
  lengthPw,
  perTask,
} = require("./config.json");

const showAsciiArt = () => {
  return new Promise((resolve, reject) => {
    figlet.text("Gmail Generator", { font: "Slant" }, (err, data) => {
      if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        reject(err);
        return;
      }
      console.log(chalk.magenta(data));
      resolve();
    });
  });
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const runGmailModule = async () => {
  try {
    if (perTask === true) {
      for (let i = 0; i < amount; i++) {
        const task = new gmailModule(
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
        ).run();

        await task;
        log(`Task ${i + 1} completed.`, "info");
        logWebhook(`Task ${i + 1} completed.`, "info", discolog);

        await sleep(2000);
      }
    } else {
      const taskPromises = [];

      for (let i = 0; i < amount; i++) {
        const task = new gmailModule(
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
        ).run();

        taskPromises.push(task);

        if (taskPromises.length === 3) {
          await Promise.race(taskPromises);
          taskPromises = taskPromises.filter((task) => !task.isFulfilled());
        }
      }

      await Promise.allSettled(taskPromises);

      log("All tasks completed in parallel.", "info");
      logWebhook("All tasks completed in parallel.", "info", discolog);
    }
  } catch (error) {
    console.error("Error running Gmail module:", error);
    if (error.message.includes("Requesting main frame too early!")) {
      log(
        "The process encountered a specific error. Returning to the prompt.",
        "warn"
      );
    }

    promptUser();
  }
};

const main = async () => {
  await showAsciiArt();
  log("Modified by Im a Saviour\n", "error");
  promptUser();
};

const promptUser = () => {
  rl.question(
    chalk.blueBright.bgYellow.bold("Select an option:\n") +
      chalk.yellow("1. Generator + SMSHUB\n") +
      chalk.yellow("2. Check Gmail\n") +
      chalk.yellow("3. Exit\n") +
      chalk.gray.bgWhite.italic("Please enter your choice: "),
    async (answer) => {
      switch (answer.trim()) {
        case "1":
          log("Generator Gmail is running", "success");
          await runGmailModule();
          promptUser();
          break;
        case "2":
          log("Check Gmail is running", "success");
          await Check();
          promptUser();
          break;
        case "3":
          log("Exiting Script..", "error");
          rl.close();
          break;
        default:
          log("Invalid option. Please select 1, 2, or 3.", "error");
          promptUser();
      }
    }
  );
};

main(); // Memulai aplikasi
