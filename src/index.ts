// Required dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";

const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// Neo4j Connection

// app.post("/api/login", async (req, res) => {
//   const session = driver.session();
//   try {
//     const { email, password } = req.body;

//     const result = await session.run(
//       "MATCH (u:User {email: $email}) RETURN u",
//       { email }
//     );

//     if (result.records.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const user = result.records[0].get("u").properties;
//     const validPassword = await bcrypt.compare(password, user.password);

//     if (!validPassword) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
//     res.json({ token, user: { ...user, password: undefined } });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     await session.close();
//   }
// });

// // Profile Routes
// app.get("/api/matches", authenticateToken, async (req, res) => {
//   const session = driver.session();
//   try {
//     const result = await session.run(
//       `
//             MATCH (u:User {id: $userId})-[m:MATCHED]-(match:User)
//             OPTIONAL MATCH (msg:Message)-[:SENT_TO]->(chat:Chat)
//             WHERE chat.user1_id IN [u.id, match.id]
//             AND chat.user2_id IN [u.id, match.id]
//             WITH u, match, msg
//             ORDER BY msg.sentAt DESC
//             LIMIT 1
//             RETURN match {
//                 .id,
//                 .name,
//                 .birthDate,
//                 .interests,
//                 matchedAt: m.createdAt,
//                 lastMessage: msg.content,
//                 lastMessageAt: msg.sentAt
//             } as matchData
//             `,
//       { userId: req.user.id }
//     );

//     const matches = result.records.map((record) => record.get("matchData"));
//     res.json(matches);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     await session.close();
//   }
// });

// app.get("/api/potential-matches", authenticateToken, async (req, res) => {
//   const session = driver.session();
//   try {
//     const result = await session.run(
//       `
//             MATCH (u:User {id: $userId})
//             MATCH (potential:User)
//             WHERE potential.id <> u.id
//             AND NOT EXISTS((u)-[:LIKED|DISLIKED]->(potential))
//             AND potential.gender IN u.preferredGenders
//             AND u.gender IN potential.preferredGenders
//             AND point.distance(u.location, potential.location) <= u.maxDistance

//             WITH u, potential,
//                  point.distance(u.location, potential.location) as distance,
//                  gds.similarity.jaccard(u.interests, potential.interests) as interestSimilarity

//             WITH u, potential,
//                  (1 - distance/100000) * 0.3 +
//                  interestSimilarity * 0.4 +
//                  CASE WHEN size([x IN u.interests WHERE x IN potential.interests]) > 0
//                       THEN 0.3 ELSE 0 END as score

//             ORDER BY score DESC
//             LIMIT 20

//             RETURN potential {
//                 .id,
//                 .name,
//                 .birthDate,
//                 .interests,
//                 score: score
//             } as potentialMatch
//             `,
//       { userId: req.user.id }
//     );

//     const matches = result.records.map((record) =>
//       record.get("potentialMatch")
//     );
//     res.json(matches);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     await session.close();
//   }
// });

// // Like/Match Routes
// app.post("/api/like/:userId", authenticateToken, async (req, res) => {
//   const session = driver.session();
//   try {
//     const result = await session.run(
//       `
//             MATCH (u1:User {id: $currentUserId})
//             MATCH (u2:User {id: $likedUserId})

//             CREATE (u1)-[l:LIKED {createdAt: datetime()}]->(u2)

//             WITH u1, u2
//             OPTIONAL MATCH (u2)-[mutual:LIKED]->(u1)
//             WHERE mutual IS NOT NULL

//             FOREACH (x IN CASE WHEN mutual IS NOT NULL THEN [1] ELSE [] END |
//                 CREATE (u1)-[:MATCHED {createdAt: datetime()}]->(u2)
//                 CREATE (u2)-[:MATCHED {createdAt: datetime()}]->(u1)
//             )

//             RETURN {
//                 isMatch: mutual IS NOT NULL,
//                 matchedUser: CASE WHEN mutual IS NOT NULL THEN u2 END
//             } as result
//             `,
//       {
//         currentUserId: req.user.id,
//         likedUserId: req.params.userId,
//       }
//     );

//     const matchResult = result.records[0].get("result");
//     res.json(matchResult);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     await session.close();
//   }
// });

// // Messaging Routes
// app.post("/api/messages/:matchId", authenticateToken, async (req, res) => {
//   const session = driver.session();
//   try {
//     const { content } = req.body;

//     const result = await session.run(
//       `
//             MATCH (sender:User {id: $senderId})-[:MATCHED]-(receiver:User {id: $receiverId})

//             MERGE (chat:Chat {
//                 user1_id: CASE WHEN $senderId < $receiverId
//                           THEN $senderId ELSE $receiverId END,
//                 user2_id: CASE WHEN $senderId < $receiverId
//                           THEN $receiverId ELSE $senderId END
//             })

//             CREATE (msg:Message {
//                 id: randomUUID(),
//                 content: $content,
//                 sentAt: datetime()
//             })
//             CREATE (msg)-[:SENT_BY]->(sender)
//             CREATE (msg)-[:SENT_TO]->(chat)

//             RETURN msg
//             `,
//       {
//         senderId: req.user.id,
//         receiverId: req.params.matchId,
//         content,
//       }
//     );

//     const message = result.records[0].get("msg").properties;
//     res.status(201).json(message);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     await session.close();
//   }
// });

// app.get("/api/messages/:matchId", authenticateToken, async (req, res) => {
//   const session = driver.session();
//   try {
//     const result = await session.run(
//       `
//             MATCH (u1:User {id: $userId})-[:MATCHED]-(u2:User {id: $matchId})
//             MATCH (msg:Message)-[:SENT_TO]->(chat:Chat)
//             WHERE chat.user1_id IN [u1.id, u2.id]
//             AND chat.user2_id IN [u1.id, u2.id]
//             MATCH (sender:User)-[:SENT_BY]-(msg)
//             RETURN msg {
//                 .id,
//                 .content,
//                 .sentAt,
//                 sender: sender.id
//             } as message
//             ORDER BY msg.sentAt DESC
//             LIMIT 50
//             `,
//       {
//         userId: req.user.id,
//         matchId: req.params.matchId,
//       }
//     );

//     const messages = result.records.map((record) => record.get("message"));
//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     await session.close();
//   }
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
