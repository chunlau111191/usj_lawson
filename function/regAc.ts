import { firefox } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { retryOnTryAgainButton } from "./functions";

import * as winston from "winston";
import { getRandomPostalCode, getRandomBanNumber } from "./addressList";

// create a logger for logging only no need to log to a file with timestamp
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

const runProgram = async (
  path: string,
  lawson_four_digit_pw: string,
  time: number,
  json: any,
  genderIdx: number,
  dayIndex: number,
  numberOfticket: number,
  event_date: string,
  paymentMethod: number
) => {
  let current_data = json[time];
  console.log(current_data, dayIndex);
  // from the json file
  let tel_number = current_data.phone;
  let email_address = current_data.email;
  let jp_last = current_data.jp_last;
  let jp_first = current_data.jp_first;
  let kata_last = current_data.kata_last;
  let kata_first = current_data.kata_first;
  let year = current_data.year;
  let month = String(current_data.month).padStart(2, "0");
  let day = String(current_data.day).padStart(2, "0");
  let postal_code: string = getRandomPostalCode().postalCode;
  let randomBanNumber: number = getRandomBanNumber();

  //同行者 information

  let browser: any = null;
  try {
    // configure the Stealth plugin
    firefox.use(StealthPlugin());
    browser = await firefox.launch({
      headless: false,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      timezoneId: "Asia/Tokyo",
      locale: "ja-JP",
      storageState: {},
    });

    // add custom headers

    const page = await context.newPage();

    // go to
    await page.goto(path);

    await page.waitForTimeout(500);

    // Wait for the submit button to appear on the page
    await page.waitForSelector('input[type="submit"]');

    // Click the submit button to submit the form
    await page.click('input[type="submit"]');

    await page.waitForTimeout(500);
    console.log("event date", event_date);
    // check consent box and click on the next button
    const consentBox = await page.$("#CONSENT_CHK_BOX");
    consentBox?.click();
    const nextButton = await page.$("#NEXT");
    nextButton?.click();
    await page.waitForNavigation();
    await page.waitForTimeout(800);

    //seatSelectBtn btnBoxBaseNew  btnDisplayNone
    // select the event
    const eventButton = await page.$("#ENTRY_DETAIL_BUTTON_0");
    eventButton?.click();
    await page.waitForNavigation();
    await page.waitForTimeout(800);

    // click the date button
    const continueButton = await page.$(".seatSelectBtn");
    continueButton?.click();

    await page.waitForTimeout(800);
    //
    // number of tickets
    const ticketBoxes = await page.$("#c_PRT_CNT1");
    //select the number of tickets
    await ticketBoxes?.selectOption({ index: numberOfticket });

    await page.waitForTimeout(800);
    // click on the next button
    const nextButton2 = await page.$("#c_ENTRY_HOPE");
    nextButton2?.click();

    // example of retrying on a "Try Again" button
    //retryOnTryAgainButton(page, "#neterrorTryAgainButton", 10, 5000); means that the function will retry 20 times with a 5-second timeout between retries.

    const navigationSuccess1 = await retryOnTryAgainButton(
      page,
      "#neterrorTryAgainButton",
      50,
      5000
    );

    // input email and telephone number
    if (navigationSuccess1) {
      await page.waitForTimeout(1500);
      const emailBox1 = await page.$("#MAIL_ADDRS");
      const emailBox2 = await page.$("#MAIL_ADDRS_CONFIRM");
      const telBox = await page.$("#TEL");
      const telBox2 = await page.$("#TEL_CONFIRM");
      const confirmButton = await page.$("#NEXT");

      await emailBox1?.fill(email_address);
      await emailBox2?.fill(email_address);
      await telBox?.fill(tel_number);
      await telBox2?.fill(tel_number);

      logger.info("Filled email and telephone number successfully.");

      // Click the confirm button
      await confirmButton?.click();
      logger.info("Clicked confirm button successfully.");

      // Handle the "Try Again" button in case it appears after clicking confirm
      await retryOnTryAgainButton(page, "#neterrorTryAgainButton", 50, 5000);

      // wait for 20 seconds for human verification
      await page.waitForNavigation({ timeout: 10 * 60 * 1000 });

      logger.info("Human verification passed successfully.");

      // select the payment method
      const paymentBoxes = await page.$$(".showBtn");
      const paymentBox = paymentBoxes[paymentMethod];
      //check the payment method
      await paymentBox?.click();
      await page.waitForTimeout(800);

      // lawson four digit password box
      const lawsonBoxes = await page.$$(".js-validate");
      const lawsonBox1 = lawsonBoxes[0];
      const lawsonBox2 = lawsonBoxes[1];
      await lawsonBox1?.fill(lawson_four_digit_pw);
      await lawsonBox2?.fill(lawson_four_digit_pw);
      logger.info("Filled Lawson four digit password successfully.");

      await page.waitForTimeout(800);
      // //telephone
      // const lawsonTelBox = await page.$("#EL_TAKE_OVER_FR_TEL");
      // const lawsonTelBox2 = await page.$("#EL_TAKE_OVER_FR_TEL_CNF");
      // await lawsonTelBox?.fill(tel_number);
      // await lawsonTelBox2?.fill(tel_number);
      // logger.info("Filled telephone number successfully.");

      // name and DoB
      const lawsonJapanLastNameBox = await page.$("#APLCT_FIRST_NAME");
      const lawsonJapanFirstNameBox = await page.$("#APLCT_LAST_NAME");
      const lawsonKataLastNameBox = await page.$("#APLCT_FIRST_NAME_KANA");
      const lawsonKataFirstNameBox = await page.$("#APLCT_LAST_NAME_KANA");
      const lawsonYearBox = await page.$("#APLCT_BIRTHDAY_YEAR");
      const lawsonMonthBox = await page.$("#APLCT_BIRTHDAY_MONTH");
      const lawsonDayBox = await page.$("#APLCT_BIRTHDAY_DAY");
      const genderBoxes = await page.$$(".aplctGender");
      const genderBox = genderBoxes[genderIdx];
      const postalCodeBox = await page.$("#APLCT_ZIP");
      const addressNumberBox = await page.$("#APLCT_LNUM");

      console.log("jp_last", jp_last, "jp_first", jp_first);

      // fill the value
      await lawsonJapanLastNameBox?.fill(jp_last);
      await lawsonJapanFirstNameBox?.fill(jp_first);
      await lawsonKataLastNameBox?.fill(kata_last);
      await lawsonKataFirstNameBox?.fill(kata_first);
      logger.info("Name filled successfully.");
      await lawsonYearBox?.fill(year.toString());
      await lawsonMonthBox?.fill(month.toString());
      await lawsonDayBox?.fill(day.toString());
      logger.info("DoB filled successfully.");
      await genderBox?.click();

      await postalCodeBox?.fill(postal_code);
      await addressNumberBox?.fill(randomBanNumber.toString());
      logger.info("Postal code and address number filled successfully.");

      await page.waitForTimeout(1000);

      // search address from postal code
      const searchButton = await page.$("#APLCT_ADDRESS_SEARCH_BUTTON");
      await searchButton?.click();

      await page.waitForTimeout(800);

      // check boxes
      const checkBox1 = await page.$("#q_1-確認了承しました");
      const checkBox2 = await page.$("#q_2-確認了承しました");

      // check the boxes
      await checkBox1?.click();
      await checkBox2?.click();

      await page.waitForTimeout(800);

      // confirm button
      const confirmButton3 = await page.$("#NEXT_BUTTON");
      await confirmButton3?.click();
      await page.waitForTimeout(800);

      // final confirm button
      const finalConfirmButton = await page.$("#ENTRY_FIX");
      await finalConfirmButton?.click();

      await page.waitForTimeout(800);
    } else {
      logger.error("Failed to navigate to the next page.");
    }
  } catch (error) {
    logger.error("Error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
    logger.info("Browser closed successfully.");
  }
};

export { runProgram, logger };
