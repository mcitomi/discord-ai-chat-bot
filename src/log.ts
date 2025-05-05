import { appendFile, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Content } from "@google/genai";

const logFile = join(import.meta.dir, "..", "log.txt");
export function writeLog(text) {
    console.log(text);
    
    appendFile(logFile, `${text}\n`, (fserr) => {
        if (fserr) {
            console.error("Unable to write logfile!")
        }
    });
}

export function getSavedHistory(): Content[] {
    const savedHistory = readFileSync(logFile, { encoding: "utf-8" }).split("\n");
    const history = [] as Content[];

    for(let row of savedHistory) {
        if(row && row != "") {
            console.log(row);

            history.push({
                "role": row.includes("user: aimodel") ? "model" : "user",
                "parts": [
                    {
                        "text": row.includes("user: aimodel") ? row.split("; text:")[1] : row
                    }
                ]
            });
        }
    }

    console.log("- Saved history loaded!");

    return history;
}