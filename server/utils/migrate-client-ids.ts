import { Storage } from "../storage"; // Correctly import the class
import { generateClientId } from "./id-generator";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function migrateClientIds() {
  try {
    // Check if users table exists before proceeding
    const usersList = await db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        clientId: true
      }
    });

    console.log(`Found ${usersList.length} users to check for client IDs`);

    // Update users without client IDs
    for (const user of usersList) {
      if (!user.clientId) {
        const newClientId = generateClientId();
        await db.update(users)
          .set({ clientId: newClientId })
          .where(eq(users.id, user.id));
        console.log(`Assigned client ID ${newClientId} to user ${user.username}`);
      }
    }
  } catch (error) {
    // If the table or column doesn't exist yet, just log and continue
    const err = error as Error; // Type assertion
    console.log("Client ID migration skipped: ", err.message); 
  }
}