import { userRegisterDataType } from "../dtos/auth-dto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { driver } from "../utils/neo4jdriver";

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

    const formatDateTime = (datetime: any) => {
      return new Date(
        datetime.year.low,
        datetime.month.low - 1,
        datetime.day.low,
        datetime.hour.low,
        datetime.minute.low,
        datetime.second.low,
        datetime.nanosecond.low / 1e6
      ).toISOString();
    };

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
