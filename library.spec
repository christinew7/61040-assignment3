<concept_spec>
concept Library [User]

purpose
    manage collection of files for users

principle
    a user creates a library to store their files,
    the user can add files to their library,
    the user can retrieve any file in their library to view its contents,
    and modify or delete the file as needed,
    they can also delete the library if it's no longer needed

state
    a set of TrackedFiles with
        an owner User
        a set of Files

    a set of Files with
        an items List<String>
        a dateAdded DateTime

    invariants
        there is at most one library per owner

actions
    create(owner: User): (library: Library)
        requires this owner doesn't already have a library
        effect creates a new library with this owner and an empty set of files

    delete(owner: User):
        requires this owner has a library
        effect deletes this owner's library

    addFile(owner: User, items: List<String>)
        requires this owner has a library, this items doesn't exist in this owner's library of files
        effect creates a file with this items and the DateTime it was added, adds this file to this owner's library

    modifyFile(owner: User, file: File, items: List<String>)
        requires this owner has a library, this file is in this owner's library
        effect change this file's items to this items

    deleteFile(owner: User, file: File)
        requires this owner has a library, this file is in this owner's library
        effect deletes this file from this owner's library

    getAllFiles(owner: User): (files: Set<File>)
        requires this owner has a library
        effect returns all files in this owner's library

</concept_spec>
