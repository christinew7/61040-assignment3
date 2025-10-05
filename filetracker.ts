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

    startTracking(owner: User, file: File) {
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
        // return trackedFile
    }

    // NEED TO DO TRACKING WITH LLM


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

        return `
You are a helpful AI assistant that finds the best tracking index of a file for crocheters.

I'm providing you with the FIRST 50 LINES of a crochet pattern file for analysis.
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

            if (!indices) {
                throw new Error('Invalid response format');
            }

            console.log('📝 Applying LLM Tracking...');

            const issues: string[] = [];

            // console.log(response);

            // const indices = response.trackedFile[0];
            console.log("indices", indices);

            const trackedFile: TrackedFile = {
                owner: owner,
                file: file,
                currentIndex: indices.currentIndex,
                maxIndex: indices.maxIndex,
                isVisible: true,
            }

            this.trackedFiles.push(trackedFile);

            // const validatedAssignments: { activity: Activity; startTime: number, importanceWeight: number }[] = [];
            // const occupiedSlots = new Map<number, Activity>();

            // for (const existingAssignment of this.assignments) {
            //     for (let offset = 0; offset < existingAssignment.activity.duration; offset++) {
            //         occupiedSlots.set(existingAssignment.startTime + offset, existingAssignment.activity);
            //     }
            // }

            // for (const rawAssignment of response.assignments) {
            //     if (typeof rawAssignment !== 'object' || rawAssignment === null) {
            //         issues.push('Encountered an assignment entry that is not an object.');
            //         continue;
            //     }

            //     const { title, startTime, importanceWeight } = rawAssignment as { title?: unknown; startTime?: unknown, importanceWeight?: unknown };

            //     if (typeof title !== 'string' || title.trim().length === 0) {
            //         issues.push('Assignment is missing a valid activity title.');
            //         continue;
            //     }

            //     const pool = activitiesByTitle.get(title);
            //     if (!pool || pool.length === 0) {
            //         issues.push(`No available occurrences of activity "${title}" to assign.`);
            //         continue;
            //     }

            //     const activity = pool.shift() as Activity;

            //     if (typeof startTime !== 'number' || !Number.isInteger(startTime)) {
            //         issues.push(`Activity "${title}" has a non-integer start time.`);
            //         continue;
            //     }

            //     if (startTime < 0 || startTime > 47) {
            //         issues.push(`Activity "${title}" has an out-of-range start time (${startTime}).`);
            //         continue;
            //     }

            //     const endSlot = startTime + activity.duration;
            //     if (endSlot > 48) {
            //         issues.push(`Activity "${title}" would extend past the end of the day.`);
            //         continue;
            //     }

            //     let conflictDetected = false;
            //     for (let offset = 0; offset < activity.duration; offset++) {
            //         const slot = startTime + offset;
            //         const occupyingActivity = occupiedSlots.get(slot);
            //         if (occupyingActivity) {
            //             issues.push(`Time slot ${this.formatTimeSlot(slot)} is already taken by "${occupyingActivity.title}" and conflicts with "${title}".`);
            //             conflictDetected = true;
            //             break;
            //         }
            //     }

            //     if (conflictDetected) {
            //         // Put the activity back so we can report subsequent issues accurately.
            //         pool.unshift(activity);
            //         continue;
            //     }

            //     for (let offset = 0; offset < activity.duration; offset++) {
            //         occupiedSlots.set(startTime + offset, activity);
            //     }

            //     if (typeof importanceWeight !== 'number' || !Number.isInteger(importanceWeight)) {
            //         issues.push(`Activity "${title}" has a non-integer importance weight.`);
            //         continue;
            //     }

            //     if (importanceWeight < 0 || importanceWeight > 5) {
            //         issues.push(`Activity "${title}" has an out-of-range importance weight (${importanceWeight}).`);
            //         continue;
            //     }
            //     validatedAssignments.push({ activity, startTime, importanceWeight });
            // }

            // if (issues.length > 0) {
            //     throw new Error(`LLM provided disallowed assignments:\n- ${issues.join('\n- ')}`);
            // }

            // for (const assignment of validatedAssignments) {
            //     this.assignActivity(assignment.activity, assignment.startTime, assignment.importanceWeight);
            //     console.log(`✅ Assigned "${assignment.activity.title}" to ${this.formatTimeSlot(assignment.startTime)}`);
            // }

        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            console.log('Response was:', responseText);
            throw error;
        }
    }

    // /**
    //  * Parse the LLM response and apply the generated assignments
    //  */
    // private parseAndApplyAssignments(responseText: string, unassignedActivities: Activity[]): void {
    //     try {
    //         // Extract JSON from response (in case there's extra text)
    //         const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    //         if (!jsonMatch) {
    //             throw new Error('No JSON found in response');
    //         }

    //         const response = JSON.parse(jsonMatch[0]);

    //         if (!response.assignments || !Array.isArray(response.assignments)) {
    //             throw new Error('Invalid response format');
    //         }

    //         console.log('📝 Applying LLM assignments...');

    //         const activitiesByTitle = new Map<string, Activity[]>();
    //         for (const activity of unassignedActivities) {
    //             const list = activitiesByTitle.get(activity.title) ?? [];
    //             list.push(activity);
    //             activitiesByTitle.set(activity.title, list);
    //         }

    //         const issues: string[] = [];
    //         const validatedAssignments: { activity: Activity; startTime: number, importanceWeight: number }[] = [];
    //         const occupiedSlots = new Map<number, Activity>();

    //         for (const existingAssignment of this.assignments) {
    //             for (let offset = 0; offset < existingAssignment.activity.duration; offset++) {
    //                 occupiedSlots.set(existingAssignment.startTime + offset, existingAssignment.activity);
    //             }
    //         }

    //         for (const rawAssignment of response.assignments) {
    //             if (typeof rawAssignment !== 'object' || rawAssignment === null) {
    //                 issues.push('Encountered an assignment entry that is not an object.');
    //                 continue;
    //             }

    //             const { title, startTime, importanceWeight } = rawAssignment as { title?: unknown; startTime?: unknown, importanceWeight?: unknown };

    //             if (typeof title !== 'string' || title.trim().length === 0) {
    //                 issues.push('Assignment is missing a valid activity title.');
    //                 continue;
    //             }

    //             const pool = activitiesByTitle.get(title);
    //             if (!pool || pool.length === 0) {
    //                 issues.push(`No available occurrences of activity "${title}" to assign.`);
    //                 continue;
    //             }

    //             const activity = pool.shift() as Activity;

    //             if (typeof startTime !== 'number' || !Number.isInteger(startTime)) {
    //                 issues.push(`Activity "${title}" has a non-integer start time.`);
    //                 continue;
    //             }

    //             if (startTime < 0 || startTime > 47) {
    //                 issues.push(`Activity "${title}" has an out-of-range start time (${startTime}).`);
    //                 continue;
    //             }

    //             const endSlot = startTime + activity.duration;
    //             if (endSlot > 48) {
    //                 issues.push(`Activity "${title}" would extend past the end of the day.`);
    //                 continue;
    //             }

    //             let conflictDetected = false;
    //             for (let offset = 0; offset < activity.duration; offset++) {
    //                 const slot = startTime + offset;
    //                 const occupyingActivity = occupiedSlots.get(slot);
    //                 if (occupyingActivity) {
    //                     issues.push(`Time slot ${this.formatTimeSlot(slot)} is already taken by "${occupyingActivity.title}" and conflicts with "${title}".`);
    //                     conflictDetected = true;
    //                     break;
    //                 }
    //             }

    //             if (conflictDetected) {
    //                 // Put the activity back so we can report subsequent issues accurately.
    //                 pool.unshift(activity);
    //                 continue;
    //             }

    //             for (let offset = 0; offset < activity.duration; offset++) {
    //                 occupiedSlots.set(startTime + offset, activity);
    //             }

    //             if (typeof importanceWeight !== 'number' || !Number.isInteger(importanceWeight)) {
    //                 issues.push(`Activity "${title}" has a non-integer importance weight.`);
    //                 continue;
    //             }

    //             if (importanceWeight < 0 || importanceWeight > 5) {
    //                 issues.push(`Activity "${title}" has an out-of-range importance weight (${importanceWeight}).`);
    //                 continue;
    //             }
    //             validatedAssignments.push({ activity, startTime, importanceWeight });
    //         }

    //         if (issues.length > 0) {
    //             throw new Error(`LLM provided disallowed assignments:\n- ${issues.join('\n- ')}`);
    //         }

    //         for (const assignment of validatedAssignments) {
    //             this.assignActivity(assignment.activity, assignment.startTime, assignment.importanceWeight);
    //             console.log(`✅ Assigned "${assignment.activity.title}" to ${this.formatTimeSlot(assignment.startTime)}`);
    //         }

    //     } catch (error) {
    //         console.error('❌ Error parsing LLM response:', (error as Error).message);
    //         console.log('Response was:', responseText);
    //         throw error;
    //     }
    // }

    // /**
    //  * Return assigned activities organized by time slots
    //  */
    // getSchedule(): { [timeSlot: number]: Activity[] } {
    //     const schedule: { [timeSlot: number]: Activity[] } = {};

    //     // Initialize all possible time slots (48 half-hour slots in a day)
    //     for (let i = 0; i < 48; i++) {
    //         schedule[i] = [];
    //     }

    //     // Walk through assignments and place activities in their time slots
    //     for (const assignment of this.assignments) {
    //         const startTime = assignment.startTime;
    //         const duration = assignment.activity.duration;

    //         // Place the activity in all its occupied time slots
    //         for (let i = 0; i < duration; i++) {
    //             const slot = startTime + i;
    //             if (slot < 48) { // Ensure we don't go beyond 24 hours
    //                 schedule[slot].push(assignment.activity);
    //             }
    //         }
    //     }

    //     return schedule;
    // }

    // /**
    //  * Format time slot number to readable time string
    //  * @param timeSlot - Time slot number (0-47)
    //  * @returns Formatted time string (e.g., "6:30 AM")
    //  */
    // formatTimeSlot(timeSlot: number): string {
    //     const hours = Math.floor(timeSlot / 2);
    //     const minutes = (timeSlot % 2) * 30;
    //     const period = hours >= 12 ? 'PM' : 'AM';
    //     const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    //     return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    // }

    // private activitiesToString(activities: Activity[]): string {
    //     return activities.map(activity => {
    //         const durationStr = activity.duration === 1 ? '30 minutes' : `${activity.duration * 0.5} hours`;
    //         return `- ${activity.title} (${durationStr})`;
    //     }).join('\n');
    // }

    // private assignmentsToString(assignments: Assignment[]): string {
    //     return assignments
    //         .map(assignment => {
    //             const time = this.formatTimeSlot(assignment.startTime);
    //             const durationStr = assignment.activity.duration === 1 ? '30 minutes' : `${assignment.activity.duration * 0.5} hours`;
    //             return `- ${assignment.activity.title} at ${time} (${durationStr})`;
    //         })
    //         .join('\n');
    // }

    // /**
    //  * Display the current schedule in a readable format
    //  */
    // displaySchedule(): void {
    //     const schedule = this.getSchedule();

    //     console.log('\n📅 Daily Schedule');
    //     console.log('==================');

    //     let hasActivities = false;

    //     for (let slot = 0; slot < 48; slot++) {
    //         const activities = schedule[slot];
    //         if (activities.length > 0) {
    //             hasActivities = true;
    //             const timeStr = this.formatTimeSlot(slot);

    //             // Only show the start of each activity (not every half-hour)
    //             const isActivityStart = activities.some(activity =>
    //                 this.assignments.find(a => a.activity === activity)?.startTime === slot
    //             );

    //             if (isActivityStart) {
    //                 const uniqueActivities = [...new Set(activities)];
    //                 for (const activity of uniqueActivities) {
    //                     const durationStr = activity.duration === 1 ? '30 min' : `${activity.duration * 0.5} hours`;
    //                     console.log(`${timeStr} - ${activity.title} (${durationStr})`);
    //                 }
    //             }
    //         }
    //     }

    //     if (!hasActivities) {
    //         console.log('No activities scheduled yet.');
    //     }

    //     console.log('\n📋 Unassigned Activities');
    //     console.log('========================');
    //     const unassigned = this.activities.filter(a => !this.isAssigned(a));
    //     if (unassigned.length > 0) {
    //         unassigned.forEach(activity => {
    //             const durationStr = activity.duration === 1 ? '30 min' : `${activity.duration * 0.5} hours`;
    //             console.log(`- ${activity.title} (${durationStr})`);
    //         });
    //     } else {
    //         console.log('All activities are assigned!');
    //     }
    // }

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
