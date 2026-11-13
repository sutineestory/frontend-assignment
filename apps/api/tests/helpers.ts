import type { User } from "../src/users/types.js";

type UserFields = {
  firstName: string;
  lastName: string;
  gender: User["gender"];
  age: number;
  hairColor: string;
  postalCode: string;
  department: string;
};

export function makeUser(fields: UserFields): User {
  return {
    firstName: fields.firstName,
    lastName: fields.lastName,
    gender: fields.gender,
    age: fields.age,
    hair: { color: fields.hairColor },
    address: { postalCode: fields.postalCode },
    company: { department: fields.department },
  };
}

export const USERS: User[] = [
  makeUser({
    firstName: "Terry",
    lastName: "Medhurst",
    gender: "male",
    age: 50,
    hairColor: "Black",
    postalCode: "10001",
    department: "Engineering",
  }),
  makeUser({
    firstName: "Sheldon",
    lastName: "Quigley",
    gender: "male",
    age: 28,
    hairColor: "Blond",
    postalCode: "10002",
    department: "Engineering",
  }),
  makeUser({
    firstName: "Terrill",
    lastName: "Hills",
    gender: "female",
    age: 38,
    hairColor: "Black",
    postalCode: "10003",
    department: "Engineering",
  }),
  makeUser({
    firstName: "Miles",
    lastName: "Cummerata",
    gender: "female",
    age: 31,
    hairColor: "Brown",
    postalCode: "20001",
    department: "Support",
  }),
];
