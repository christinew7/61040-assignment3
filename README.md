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

## Test Cases

### Test Case 1: Full Pattern with lots of miscellaneous information in the beginning

There are some patterns that have a lot of miscellaneous text before the actual instruction of the pattern. In this test case, the pattern has a lot of empty lines and space in between and teaches how to crochet each stitch before getting into the pattern. The user just needs to copy and paste their pattern to the LLM, there is no change in user action. When I did this, I kept having an error that the API expected "," or "}" after after property value in JSON at position 140 (line 7 column 14). Originally, I thought there was some bug with having empty lines, but it turns out that the JSON response was just being truncated because it was too long. My original prompt had the LLM return the full trackedFile data structure, which would be too long for long patterns, so I rewrote the function to just return the currentIndex and also only passed in a truncated pattern (up to line 40), so there is less load on the LLM. I still had an error with this: it wasn't returning the correct index (it was two lines off), so I updated the range to line 50 and it worked!

Prompt variant:
In my prompt, I added a variable `analysisLines`, which slices the file's items to the first 50 items. I added to the critical requirements that it is only analyzing the first 50 items, but there are more in the original file. To the returned prompt, I added a File Preview line and passed in `analysisLines`. I also changed the returned JSON object to just return the two indices, `currentIndex` and `maxIndex`.

### Test Case 2: Tutorials before the real pattern
I originally tested with emojis as the numbering guide for patterns, and this worked. It even worked if I had duplicate numbering with two 1️⃣ a few lines apart. However, when I added a "subtitle" to a tutorial section, the LLM broke and highlighted the subtitle (returned the index of the subtitle), not even the first instruction of the tutorial. In the prompt, I added a `potentialSections` array of common potential section titles so the LLM knows to ignore these as the start of the pattern. This worked in skipping the tutorial section, but it started highlighting the 'body' subtitle, which was the start of the real pattern. In the prompt, I specified to "Find the index of the first instruction, NOT the index of the section title, some of which are defined below." I also moved the line that feeds the `potentialSections` to be right below this new line. This gets the instruction right half of the time, and the other half, it goes to the first instruction of the tutorial section.  I added a new line specifying tutorial instructions should be ignored: "Ignore any instructional steps for the basic or tutorial stitches, like single crochet, double crochet, magic ring."

<!-- "I tested a pattern that has different variations of numbering patterns (Roman Numerals (2a) and using Emojis (2b)). -->

### Test Case 2: Full Pattern with Many Sections

<!-- I ADDED SECTION POTENTIALS -->

<!--
## Quick Setup

### 0. Clone the repo locally and navigate to it
```cd intro-gemini-schedule```

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your API Key

**Why use a template?** The `config.json` file contains your private API key and should never be committed to version control. The template approach lets you:
- Keep the template file in git (safe to share)
- Create your own `config.json` locally (keeps your API key private)
- Easily set up the project on any machine

**Step 1:** Copy the template file:
```bash
cp config.json.template config.json
```

**Step 2:** Edit `config.json` and add your API key:
```json
{
  "apiKey": "YOUR_GEMINI_API_KEY_HERE"
}
```

**To get your API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into `config.json` (replacing `YOUR_GEMINI_API_KEY_HERE`)

### 3. Run the Application

**Run all test cases:**
```bash
npm start
```

<!-- **Run specific test cases:**
```bash
npm run manual    # Manual scheduling only
npm run llm       # LLM-assisted scheduling only
npm run mixed     # Mixed manual + LLM scheduling -->
<!-- ```

## File Structure

```
dayplanner/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── config.json               # Your Gemini API key
├── dayplanner-types.ts       # Core type definitions
├── dayplanner.ts             # DayPlanner class implementation
├── dayplanner-llm.ts         # LLM integration
├── dayplanner-tests.ts       # Test cases and examples
├── dist/                     # Compiled JavaScript output
└── README.md                 # This file
```

## Test Cases

The application includes three comprehensive test cases:

### 1. Manual Scheduling
Demonstrates adding activities and manually assigning them to time slots:

```typescript
const planner = new DayPlanner();
const breakfast = planner.addActivity('Breakfast', 1); // 30 minutes
planner.assignActivity(breakfast, 14); // 7:00 AM
``` -->

<!-- ### 2. LLM-Assisted Scheduling
Shows AI-powered scheduling with hardwired preferences:

```typescript
const planner = new DayPlanner();
planner.addActivity('Morning Jog', 2);
planner.addActivity('Math Homework', 4);
await llm.requestAssignmentsFromLLM(planner);
```

### 3. Mixed Scheduling
Combines manual assignments with AI assistance for remaining activities.

## Sample Output

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

<!-- ## Key Features

- **Simple State Management**: Activities and assignments stored in memory
- **Flexible Time System**: Half-hour slots from midnight (0-47)
- **Query-Based Display**: Schedule generated on-demand, not stored sorted
- **AI Integration**: Hardwired preferences in LLM prompt (no external hints)
- **Conflict Detection**: Prevents overlapping activities
- **Clean Architecture**: First principles implementation with no legacy code -->

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

## Next Steps

Try extending the DayPlanner:
- Add weekly scheduling
- Implement activity categories
- Add location information
- Create a web interface
- Add conflict resolution strategies
- Implement recurring activities
-->

## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
