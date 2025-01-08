import { runProgram, logger } from "./function/regAc";
import { RegList } from "./function/readExcel";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

(async () => {
  try {
    //read the excel file
    //main account
    const reg_list_json = RegList.readExcelFile(
      "./config_file/email_list.xlsx"
    );

    // set mode to 1 for running the full program, 0 for running partial program
    // use prompt to ask user for input
    let mode = 0;
    let dayIndex = 0; // 0 = timeslot1, 1 = timeslot2, 2

    // set path to the event
    const lawson_path =
      "file://" + path.resolve(__dirname, "./config_file/lawson.html");
    // information configuration
    let lawson_four_digit_pw = "A123"; //set a 4 digit password for lawson

    // gender Male = 0, Female = 1
    const genderIdx = 0;

    // Day Selection. index 0 = day1, index 1 = day2, index 2 = day3
    // payment methods 0 = credit card, 1 = convenience store
    const paymentMethod = 1;

    // 1 = 1枚, 2 = 2枚
    let numberOfTicket = 4;
    let event_date = "20250311";
    // define min and max row and event day
    let minRow: number;
    let maxRow: number;

    if (Number(mode) == 1) {
      // set number of records to be created
      minRow = 1;
      maxRow = reg_list_json.length;
    } else {
      // set number of records to be created
      minRow = 1;
      maxRow = 5;
    }
    if (minRow < 1) {
      minRow = 1;
    }
    if (reg_list_json.length > 0) {
      logger.info("Start running program");
      // loop through all days and run the program
      for (let i = minRow - 1; i < maxRow; i++) {
        await runProgram(
          lawson_path,
          lawson_four_digit_pw,
          i,
          reg_list_json,
          genderIdx,
          dayIndex,
          numberOfTicket,
          event_date,
          paymentMethod
        );
      }
    }
  } catch (e) {
    logger.error(e);
  }
})();
