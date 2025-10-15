/**
 * FileTracker Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';
import { User } from './passwordauthentication';
import { File } from "./library";

// a File owned by owner that can be tracked
export interface TrackedFile {
    owner: User;
    file: File;
    currentIndex: number; // 0 <> maxIndex
    maxIndex: number;
    isVisible: boolean;
}

export class FileTracker {
    private trackedFiles: TrackedFile[] = [];

    startTracking(owner: User, file: File): void {
        const findingTrackedFile = this.trackedFiles.find(tf => tf.owner === owner && tf.file === file);

        if (findingTrackedFile) {
            throw new Error(`This owner ${owner} with this file ${file} already exists`);
        }

        const trackedFile: TrackedFile = {
            owner,
            file,
            currentIndex: 0,
            maxIndex: file.items.length - 1,
            isVisible: true,
        }
        this.trackedFiles.push(trackedFile);
    }

    deleteTracking(owner: User, file: File): void {
        this.trackedFiles = this.trackedFiles.filter(trackedFile => trackedFile.file !== file && trackedFile.owner !== owner);
    }

    jumpTo(owner: User, file: File, index: number): void {
        const trackedFile = this.trackedFiles.find(tf => tf.owner === owner && tf.file === file);

        if (!trackedFile) {
            throw new Error(`This owner ${owner} with this file ${file} cannot be tracked`);
        }

        if (index < 0 || index > trackedFile.maxIndex) {
            throw new Error('This index ${index} is out of range');
        }

        trackedFile.currentIndex = index;
    }

    next(owner: User, file: File): void {
        const trackedFile = this.trackedFiles.find(tf => tf.owner === owner && tf.file === file);

        if (!trackedFile) {
            throw new Error(`This owner ${owner} with this file ${file} cannot be tracked`);
        }

        if (trackedFile.currentIndex < trackedFile.maxIndex) trackedFile.currentIndex++;
    }

    back(owner: User, file: File): void {
        const trackedFile = this.trackedFiles.find(tf => tf.owner === owner && tf.file === file);

        if (!trackedFile) {
            throw new Error(`This owner ${owner} with this file ${file} cannot be tracked`);
        }

        if (trackedFile.currentIndex > 0) trackedFile.currentIndex--;
    }

    getCurrentItem(owner: User, file: File): number {
        const trackedFile = this.trackedFiles.find(tf => tf.owner === owner && tf.file === file);

        if (!trackedFile) {
            throw new Error(`This owner ${owner} with this file ${file} cannot be tracked`);
        }

        return trackedFile.currentIndex;
    }

    setVisibility(owner: User, file: File, visible: boolean) {
        const trackedFile = this.trackedFiles.find(tf => tf.owner === owner && tf.file === file);

        if (!trackedFile) {
            throw new Error(`This owner ${owner} with this file ${file} cannot be tracked`);
        }

        trackedFile.isVisible = visible;
    }

    async startTrackingUsingLLM(owner: User, file: File, llm: GeminiLLM): Promise<void> {
        try {
            console.log('🤖 Tracking file from Gemini API...');

            const prompt = this.createTrackingPrompt(file);
            const text = await llm.executeLLM(prompt);

            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');

            // Parse and apply the assignments
            this.parseAndStartTracking(text, owner, file);
            // this.parseAndStartTracking(text);

        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }

    /**
     * Helper functions and queries follow
     */

    /**
     * Create the prompt for Gemini with hardwired preferences
     */
    private createTrackingPrompt(file: File): string {
        const analysisLines = file.items.slice(0, 50);

        const criticalRequirements = [
            "1. The currentIndex MUST be between 0 and maxIndex (INCLUSIVE)",
            "2. You are only analyzing the first 50 lines, but your current index should reference the ORIGINAL full file",
            `3. The actual file has ${file.items.length} total lines, but you only see the first 50 for analysis`
        ]

        const potentialSections = [
            "Materials",
            "Stitch Abbreviations",
            "Finished Size",
            "Notes",
            "Gauge",
            "Stitch Terms",
            "Tools",
            "Single crochet",
            "Double crochet",
            "Body",
            "Head",
        ]

        const commonOCRErrors = [
            "'ohain' -> 'chain'",
            "'row l' -> 'row 1'",
            "'eaoh' -> 'each'",
            "'materia1s' -> 'materials'",
            "'0' -> 'O'",
            "'5' -> 'S'",
        ]

        return `
You are a helpful AI assistant that finds the best tracking index of a file for crocheters.

I'm providing you with the FIRST 50 LINES of a crochet pattern file for analysis.
This may contain OCR errors from scanning. Be flexible in recognizing instructions despite character recognition issues.
POTENTIAL OCR ERRORS
${commonOCRErrors.join('\n')}

The full file has ${file.items.length} total lines.

The file will be passed as a list of line entries, where the first couple of sections are NOT instructions.
There will be a MATERIALS section and optionally, other potential sections listed below. The sections are case-INsensitive.
Then, there will be the instructions section, which can include multiple subsections.
You are to provide the index at the first instruction of the main pattern section. This may be marked by "1.", but it might not include the line item.
Ignore any instructional steps for the basic or tutorial stitches, like single crochet, double crochet, magic ring.
Find the index of the first instruction, NOT the index of the section title, some of which are defined below.

POTENTIAL SECTIONS:
${potentialSections.join('\n')}

FILE PREVIEW (first 50 lines):
${analysisLines.map((line, index) => `[${index}]: ${line}`).join('\n')}

CRITICAL REQUIREMENTS:
${criticalRequirements.join('\n')}

Return your response as a JSON object with this exact structure. Use integers and obey the ranges shown.

{
    "currentIndex": {YOUR DETERMINED INDEX}, // Must be 0 - ${file.items.length - 1},
    "maxIndex": ${file.items.length - 1},
}

Return ONLY the JSON object, no additional text. Strictly enforce the integer ranges above — if you cannot satisfy them, return an empty assignments array.
        `
    }

    /**
     * Parse the LLM response and create a new TrackingFile
     */
    private parseAndStartTracking(responseText: string, owner: User, file: File): void {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const indices = JSON.parse(jsonMatch[0]);

            const issues: string[] = [];

            if (!indices) {
                issues.push(`Invalid response format: ${indices}`);
            }

            console.log('📝 Applying LLM Tracking...');

            // checking format
            if (!indices.currentIndex) {
                issues.push(`Invalid response, there is no currentIndex passed in.`);
            }
            if (!indices.maxIndex) {
                issues.push(`Invalid response, there is no maxIndex passed in.`);
            }

            // checking bounds
            if (indices.currentIndex < 0 || indices.currentIndex > indices.maxIndex) {
                issues.push(`currentIndex ${indices.currentIndex} is out of bounds`);
            }
            if (indices.maxIndex !== file.items.length - 1) {
                issues.push(`maxIndex ${indices.maxIndex} is not correct`);
            }

            // checking type
            if (typeof indices.currentIndex !== "number") {
                issues.push(`currentIndex ${indices.currentIndex} is not a number`);
            }
            if (typeof indices.maxIndex !== "number") {
                issues.push(`maxIndex ${indices.maxIndex} is not a number`);
            }


            const trackedFile: TrackedFile = {
                owner: owner,
                file: file,
                currentIndex: indices.currentIndex,
                maxIndex: indices.maxIndex,
                isVisible: true,
            }

            this.trackedFiles.push(trackedFile);

        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            console.log('Response was:', responseText);
            throw error;
        }
    }

    private getTrackedFiles(): TrackedFile[] {
        return this.trackedFiles;
    }

    /**
     * Display the file in a readable format (emphasizing the current index)
     */
    displayTrackedFiles(): void {
        const trackedFiles = this.getTrackedFiles();

        trackedFiles.forEach(tf => {
            console.log(`Owner: ${tf.owner.username}`);
            console.log(`File with ${tf.file.items.length} items: `);

            tf.file.items.forEach((item, index) => {
                if (index === tf.currentIndex) {
                    console.log(`\x1b[1m${item}\x1b[0m`);
                } else {
                    console.log(item);
                }
            });

            console.log('------------------------------');
        });

    }
}
