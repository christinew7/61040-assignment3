<concept_spec>
concept FileTracker [User, File]

purpose
    track current position and enable navigation within files

principle
    a user can start tracking their file from the first listed item (which might not be the first item),
    a user can also use an LLM to start tracking their file at a better suited item within the file
    they can move through file items sequentially without losing their place or skip to a file item
    and control how progress is displayed

state
    a set of TrackedFiles with
        an owner User
        a file File
        a currentIndex Number // 0 <> maxIndex
        a maxIndex Number
        a isVisible Flag

    invariants
        currentIndex is between 0 and maxIndex

actions
    startTracking(owner: User, file: File)
        requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
        effect create a new TrackedFile with this owner and this file, currentIndex is initialized to 0, maxIndex is the length of the file's items, isVisible set to true

    startTrackingUsingLLM(owner: User, file: File, llm: GeminiLLM)
        requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
        effect uses this llm to determine a more accurate startIndex for the file

    deleteTracking(owner: User, file: File)
        requires this owner and this file is in the set of TrackedFiles
        effect delete this TrackedFile

    jumpTo(owner: User, file: File, index: Number)
        requires this owner and this file exists in the TrackedFiles, this index is a valid index between 0 and the maxIndex
        effect updates the currentIndex of the TrackedFile with this owner and this file to this index

    next(owner: User, file: File)
        requires this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is less than the maxIndex
        effect increments the TrackedFile with this owner and this file by 1

    back(owner: User, file: File)
        requires this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0
        effect decrements the TrackedFile with this owner and this file by 1

    getCurrentItem(owner: User, file: File): (index: Number)
        requires this owner and this file exists in the TrackedFiles
        effect in the TrackedFile with this owner and this file, return the currentIndex

    setVisibility(owner: User, file: File, visible: Flag)
        requires this owner and this file exists in the TrackedFiles
        effect in the TrackedFile with this owner and this file, set isVisible to this visible

</concept_spec>
