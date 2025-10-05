# FileTracker

This implementation focuses on the core concept of initializing the progress of files with both manual and AI-assisted scheduling.

## Concept: FileTracker

**Purpose**: track current position and enable navigation within files <br>
**Principle**: a user can start tracking their file from the first listed item (which might not be the first item), <br>
a user can also use an LLM to start tracking their file at a better suited item within the file <br>
they can move through file items sequentially without losing their place or skip to a file item <br>
and control how progress is displayed <br>

### Core State

- **TrackedFiles**: Set of TrackedFiles with owner, file, currentIndex, maxIndex, isVisible <br>

### Core Actions

- `startTracking(owner: User, file: File)`
- `startTracking(owner: User, file: File, llm: GeminiLLM)` - AI assisted tracking
- `deleteTracking(owner: User, file: File)`
- `jumpTo(owner: User, file: File, index: Number)`
- `back(owner: User, file: File)`
- `getCurrentItem(owner: User, file: File): (index: Number)`
- `setVisibility(owner: User, file: File, visible: Flag)`

## Prerequisites

- **Node.js** (version 14 or higher)
- **TypeScript** (will be installed automatically)
- **Google Gemini API Key** (free at [Google AI Studio](https://makersuite.google.com/app/apikey))

## Context/Notes

I felt like AI would be more limited in my other concepts (PasswordAuthentication, Dictionary (basic mapping to and from terms)). The other concept is a Library, which primarily stores files, and AI could have been used to help translate plain text into my data structure for File, but that's a backend implementation rather than something directly visible to the user. Since the users in my project will be submitting crochet patterns, the first real step of the pattern will not always be the first few lines; there could be a materials section and other miscellaneous introductions, so AI would be useful in determining where the first step is (to highlight in the frontend). I created the generic User and File type as interfaces in their respective concept files just to be able to pass it in to the `startTracking` functions.

## User Interaction

![](/61040-assignment3/assets/ai%20filetracking.png)

![](/61040-assignment3/assets/ai%20user%20check.png)

### User Journey

Bobbert uploads the crochet pattern he wants to follow. Since it's just a big block of text, he'll have to manually find and click on the first instruction when the next page loads. Instead, he chooses to "Submit with LLM," which automatically finds analyzes the file to locate the first instruction for him. The LLM correctly identifies the first instruction hidden after the Materials, Tools, and Stitch Abbreviations sections. He's happy that the app can instantly highlight where he should begin after he already has the materials ready.

## Test Cases

Note: Since the interface is likely to be simple and front-end heavy (visual translations and dimming/bolding feature to emphasize what step the crocheter is on), the actual UI interaction is copying and pasting the pattern to the interface and calling the LLM. The variance in scenarios stem from the different patterns that exist and if the user wants to make additional formatting.

### Test Case 1: Full Pattern with lots of miscellaneous information in the beginning

There are some patterns that have a lot of miscellaneous text before the actual instruction of the pattern. In this test case, the pattern has a lot of empty lines and space in between and teaches how to crochet each stitch before getting into the pattern. When I did this, I kept having an error that the API expected "," or "}" after after property value in JSON at position 140 (line 7 column 14). Originally, I thought there was some bug with having empty lines, but it turns out that the JSON response was just being truncated because it was too long. My original prompt had the LLM return the full trackedFile data structure, which would be too long for long patterns, so I rewrote the function to just return the currentIndex and also only passed in a truncated pattern (up to line 40), so there is less load on the LLM. I still had an error with this: it wasn't returning the correct index (it was two lines off), so I updated the range to line 50 and it worked!

Prompt variant:
In my prompt, I added a variable `analysisLines`, which slices the file's items to the first 50 items. I added to the critical requirements that it is only analyzing the first 50 items, but there are more in the original file. To the returned prompt, I added a File Preview line and passed in `analysisLines`. I also changed the returned JSON object to just return the two indices, `currentIndex` and `maxIndex`.

### Test Case 2: Tutorials before the real pattern

I originally tested with emojis as the numbering guide for patterns, and this worked. It even worked if I had duplicate numbering with two 1️⃣ a few lines apart. However, when I added a "subtitle" to a tutorial section, the LLM broke and highlighted the subtitle (returned the index of the subtitle), not even the first instruction of the tutorial. In the prompt, I added a `potentialSections` array of common potential section titles so the LLM knows to ignore these as the start of the pattern. This worked in skipping the tutorial section, but it started highlighting the 'body' subtitle, which was the start of the real pattern. In the prompt, I specified to "Find the index of the first instruction, NOT the index of the section title, some of which are defined below." I also moved the line that feeds the `potentialSections` to be right below this new line. This gets the instruction right half of the time, and the other half, it goes to the first instruction of the tutorial section. I added a new line specifying tutorial instructions should be ignored: "Ignore any instructional steps for the basic or tutorial stitches, like single crochet, double crochet, magic ring."

### Test Case 3:

I tested with some patterns that might be scanned and uploaded, which might contain (Optical Character Recognition) OCR errors. The LLM worked in getting an index at the instructions section, but skipped a step. So, I added to the prompt a line about OCR errors and a `commonOCRErrors` array that maps errors to the word it is supposed to represent. (Prompt addition: This may contain OCR errors from scanning. Be flexible in recognizing instructions despite character recognition issues.) This immediately helped with highlighting the first instruction.

## Validators

Since I changed my code so the LLM returns just the indices, instead of the full TrackedFile (to minimize token count), there are a little less issues to account for. The first is the LLM just won't listen and return a non JSON output or a JSON output that is mistructured and the indices are wrapped in extra text. The second plausible issue is the currentIndex being out of bounds. It has to be within 0 and the last item in the file, maxIndex, inclusive. The third plausible issue is if the maxIndex matches the file's maxIndex; it might return 49 because I sent a shortened file when creating the prompt to minimize the tokens. This isn't as dependent on the LLM, so another plausible issue is that the indices aren't returned as numbers, and potentially the stringify-ed value of the number.

<!-- ## Sample Output

```
Owner: alice
File with 9 items:
Materials
Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)
Tools
Hook: 4mm
Darning Needle
Scissors
Instructions
>> Foundation Chain: Ch 6, ss in 6th ch from hook to form a ring.
Round One: Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3.
``` -->

<!-- ## LLM Preferences (Hardwired)

The AI uses these built-in preferences:
- Exercise activities: Morning (6:00 AM - 10:00 AM)
- Study/Classes: Focused hours (9:00 AM - 5:00 PM)
- Meals: Regular intervals (breakfast 7-9 AM, lunch 12-1 PM, dinner 6-8 PM)
- Social/Relaxation: Evenings (6:00 PM - 10:00 PM)
- Avoid: Demanding activities after 10:00 PM -->

<!-- ## Troubleshooting

### "Could not load config.json"
- Ensure `config.json` exists with your API key
- Check JSON format is correct

### "Error calling Gemini API"
- Verify API key is correct
- Check internet connection
- Ensure API access is enabled in Google AI Studio

### Build Issues
- Use `npm run build` to compile TypeScript
- Check that all dependencies are installed with `npm install`

## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) -->
