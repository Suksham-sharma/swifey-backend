import { formatDateTime, geApproxUserAgeInYears } from "../utils/helpers";
import { driver } from "../utils/neo4jdriver";

export const getPotentialMatches = async (userId: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
            MATCH (u:User {id: $userId})
            MATCH (potential:User)
            WHERE potential.id <> u.id
            AND NOT EXISTS((u)-[:LIKED|DISLIKED]->(potential))
            AND potential.gender IN u.preferredGenders
            AND u.gender IN potential.preferredGenders

          WITH u, potential,
            size([x IN u.interests WHERE x IN potential.interests]) AS intersectionSize,
            size(u.interests) + size(potential.interests) -
            size([x IN u.interests WHERE x IN potential.interests]) AS unionSize

          WITH u, potential,
            (1.0 * intersectionSize) / unionSize AS interestSimilarity,
            CASE WHEN intersectionSize > 0 THEN 0.4 ELSE 0 END AS additionalScore

          WITH u, potential,
            interestSimilarity * 0.6 + additionalScore AS score

            ORDER BY score DESC
            LIMIT 20

            RETURN potential {
                .id,
                .name,
                .birthDate,
                .interests,
                score: score
            } as potentialMatch
            `,
      { userId: userId }
    );

    const matches = result.records.map((record) =>
      record.get("potentialMatch")
    );

    matches.forEach((match) => {
      const birthDate = formatDateTime(match.birthDate);
      match.age = geApproxUserAgeInYears(birthDate);
      delete match.birthDate;
    });

    return matches;
  } catch (error: any) {
    return { error: error.message };
  } finally {
    await session.close();
  }
};

export const getAllUsers = async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
            MATCH (u:User)
            RETURN u {
                .id,
                .name,
                .birthDate,
                .interests
            } as user
            `
    );

    const users = result.records.map((record) => record.get("user"));

    users.forEach((user) => {
      const birthDate = formatDateTime(user.birthDate);
      user.age = geApproxUserAgeInYears(birthDate);
      delete user.birthDate;
    });
    console.log(result.records);
    console.log(users);
    return users;
  } catch (error: any) {}
};

export const likeUser = async (userId: string, potentialId: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
            MATCH (u1:User {id: $currentUserId})
            MATCH (u2:User {id: $likedUserId})

            MERGE (u1)-[l:LIKED]->(u2)
            ON CREATE SET l.createdAt = datetime()

            WITH u1, u2
            OPTIONAL MATCH (u2)-[mutual:LIKED]->(u1)
            WHERE mutual IS NOT NULL

            FOREACH (x IN CASE WHEN mutual IS NOT NULL THEN [1] ELSE [] END |
                MERGE (u1)-[:MATCHED]->(u2)
                MERGE (u2)-[:MATCHED {createdAt: datetime()}]->(u1)
            )

          RETURN {
            isMatch: mutual IS NOT NULL,
            user: {
            id: u2.id,
            name: u2.name,
            birthDate: u2.birthDate
            }
          } AS result
            `,
      {
        currentUserId: userId,
        likedUserId: potentialId,
      }
    );

    const matchResult = result.records[0].get("result");
    const isMatch = matchResult.isMatch;
    const user = matchResult.user;

    const birthDate = formatDateTime(user.birthDate);
    user.age = geApproxUserAgeInYears(birthDate);
    delete user.birthDate;

    return { isMatch, user };
  } catch (error: any) {
    console.log(error);
  } finally {
    session.close();
  }
};

export const dislikeUser = async (userId: string, potentialId: string) => {
  const session = driver.session();
  console.log(userId, potentialId);
  try {
    const result = await session.run(
      `
            MATCH (u1:User {id: $currentUserId})
            MATCH (u2:User {id: $dislikedUserId})

            MERGE (u1)-[d:DISLIKED]->(u2)
            ON CREATE SET d.createdAt = datetime()

            RETURN {
                dislikedUser: u2.id
                } as result
            `,
      {
        currentUserId: userId,
        dislikedUserId: potentialId,
      }
    );

    return {
      action: "disliked",
      dislikedUser: result.records[0].get("result").dislikedUser,
    };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getUserMatches = async (userId: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
            MATCH (u1:User {id: $userId})-[:MATCHED]-(u2:User)
            RETURN u2 {
                .id,
                .name,
                .birthDate,
                .interests
            } as match
            `,
      { userId: userId }
    );

    const matches = result.records.map((record) => record.get("match"));
    matches.forEach((match) => {
      const birthDate = formatDateTime(match.birthDate);
      match.age = geApproxUserAgeInYears(birthDate);
      delete match.birthDate;
    });
    return matches;
  } catch (error: any) {}
};
