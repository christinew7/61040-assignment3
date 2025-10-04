/**
 * PasswordAuthentication Concept
 */

// a User defined by a username and password
export interface User {
    username: string,
    password: string,
}

export class PasswordAuthenticaion {
    private users: User[] = [];

    register(username: string, password: string): User {
        const findUser = this.users.find(user => user.username === username);

        if (findUser) {
            throw new Error(`This user already exists`);
        }

        const user: User = {
            username,
            password
        }

        this.users.push(user);
        return user;
    }

    authenticate(username: string, password: string): User {
        const user = this.users.find(user => user.username === username);

        if (!user) {
            throw new Error(`This user ${user} does not exist`);
        }

        if (user.password !== password) {
            throw new Error('Wrong password for user ${user}');
        }

        return user;
    }
}
