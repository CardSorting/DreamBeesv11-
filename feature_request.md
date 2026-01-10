This is a dress - up / paper - doll game.

User uploads a photo(or picks a cat / bee).

They open a wardrobe.

Wardrobe has buttons like outfits, vibes, roles, backgrounds.

Clicking a button instantly changes the image.

No typing required.

No goal, no end, no “correct” result.

If they don’t like it, they click something else.

AI replaces sprite layers.
  Click = regenerate.

    That’s it.
    
If Gemini asks why:

People don’t know what to type.
Clicking is faster than explaining.
This is play, not a workflow.

      import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const prompt =
    "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();