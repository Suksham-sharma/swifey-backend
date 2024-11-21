import { userRegisterDataType, userSignInDataType } from "../dtos/auth-dto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { driver } from "../utils/neo4jdriver";
import { formatDateTime } from "../utils/helpers";

dotenv.config();

export const registerUser = async (
  registerUserPayload: userRegisterDataType
) => {
  const session = driver.session();
  try {
    const {
      email,
      password,
      name,
      birthDate,
      gender,
      preferredGenders,
      interests,
    } = registerUserPayload;

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await session.run(
      "MATCH (u:User {email: $email}) RETURN u",
      { email }
    );

    if (existingUser.records.length > 0) {
      return {
        error: "User with the given Email already exists",
        status: false,
      };
    }

    const result = await session.run(
      `
        CREATE (u:User {
            id: randomUUID(),
            email: $email,
            password: $password,
            name: $name,
            birthDate: datetime($birthDate),
            gender: $gender,
            preferredGenders: $preferredGenders,
            interests: $interests,
            createdAt: datetime()
        })
        RETURN u
      `,
      {
        email,
        password: hashedPassword,
        name,
        birthDate,
        gender,
        preferredGenders,
        interests,
      }
    );

    const user = result.records[0].get("u").properties;
    user.birthDate = formatDateTime(user.birthDate);
    user.createdAt = formatDateTime(user.createdAt);

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "Hey there"
    );

    return { token, user: { ...user, password: undefined }, status: true };
  } catch (error: any) {
    return { error: error.message, status: false };
  } finally {
    await session.close();
  }
};

export const signInUser = async (signInPayload: userSignInDataType) => {
  const session = driver.session();
  try {
    const { email, password } = signInPayload;

    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u",
      { email }
    );

    if (result.records.length === 0) {
      return { error: "Invalid credentials", status: false };
    }

    const user = result.records[0].get("u").properties;
    user.birthDate = formatDateTime(user.birthDate);
    user.createdAt = formatDateTime(user.createdAt);
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return { error: "Invalid credentials", status: false };
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "");
    return { token, user: { ...user, password: undefined }, status: true };
  } catch (error: any) {
    return { error: error.message, status: false };
  } finally {
    session.close();
  }
};
