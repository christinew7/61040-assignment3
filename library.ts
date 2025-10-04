/**
 * Library Concept
 */

import { User } from "./passwordauthentication";

// a Library with an owner and its set of files
export interface LibraryData {
    owner: User,
    files: File[]
}

export interface File {
    items: string[],
    dateAdded: Date
}

export class Library {
    private libraries: LibraryData[] = [];
    private files: File[] = [];

    create(owner: User): LibraryData {
        const findLibrary = this.libraries.find(library => library.owner === owner);

        if (findLibrary) {
            throw new Error(`There already exists a library ${findLibrary} for this owner ${owner}`);
        }

        const library: LibraryData = {
            owner,
            files: []
        }

        this.libraries.push(library);
        return library;
    }

    delete(owner: User): void {
        const findLibrary = this.libraries.find(library => library.owner === owner);

        if (!findLibrary) {
            throw new Error(`There is no library with this owner ${owner}`);
        }

        this.libraries = this.libraries.filter(l => l !== findLibrary);
    }

    addFile(owner: User, items: string[]): void {
        const library = this.libraries.find(lib => lib.owner === owner);
        if (!library) {
            throw new Error(`Owner ${owner.username} does not have a library`);
        }

        const exists = [...library.files].some(file => JSON.stringify(file.items) === JSON.stringify(items));
        if (exists) {
            throw new Error(`File with these items already exists in ${owner.username}'s library`);
        }

        const newFile: File = {
            items,
            dateAdded: new Date()
        };

        library.files.push(newFile);
    }

    modifyFile(owner: User, file: File, items: string[]): void {
        const library = this.libraries.find(lib => lib.owner === owner);
        if (!library) {
            throw new Error(`Owner ${owner.username} does not have a library`);
        }

        const indexOfFile = library.files.indexOf(file);
        if (indexOfFile === -1) {
            throw new Error(`The file does not exist in ${owner.username}'s library`);
        }

        library.files[indexOfFile] = { ...file, items };
    }

    deleteFile(owner: User, file: File): void {
        const library = this.libraries.find(lib => lib.owner === owner);
        if (!library) {
            throw new Error(`Owner ${owner.username} does not have a library`);
        }

        const indexOfFile = library.files.indexOf(file);
        if (indexOfFile === -1) {
            throw new Error(`The file does not exist in ${owner.username}'s library`);
        }

        library.files.splice(indexOfFile, 1);
    }

    getAllFiles(owner: User): File[] {
        const library = this.libraries.find(lib => lib.owner === owner);
        if (!library) {
            throw new Error(`Owner ${owner.username} does not have a library`);
        }

        return [...library.files].sort(
            (a, b) => a.dateAdded.getTime() - b.dateAdded.getTime()
        );
    }

    // addFile(owner: User, items: List<String>)
    //     requires this owner has a library, this items doesn't exist in this owner's library of files
    //     effect creates a file with this items and the DateTime it was added, adds this file to this owner's library

    // modifyFile(owner: User, file: File, items: List<String>)
    //     requires this owner has a library, this file is in this owner's library
    //     effect change this file's items to this items

    // deleteFile(owner: User, file: File)
    //     requires this owner has a library, this file is in this owner's library
    //     effect deletes this file from this owner's library

    // getAllFiles(owner: User): (files: Set<File>)
    //     requires this owner has a library
    //     effect returns all files in this owner's library
}
