// scripts/migrate-to-groups.ts
// Run this script once to migrate existing data to the groups system

import { dbConnect } from "../src/lib/mongoose";
import Group from "../src/models/Group";
import Game from "../src/models/Game";
import Player from "../src/models/Player";
import Leaderboard from "../src/models/Leaderboard";

async function migrateToGroups() {
    try {
        await dbConnect();
        console.log("🔄 Starting migration to groups system...");

        // Check if we already have groups
        const existingGroups = await Group.countDocuments();
        if (existingGroups > 0) {
            console.log("✅ Groups already exist. Skipping migration.");
            return;
        }

        // Create a default group for existing data
        const defaultGroup = await Group.create({
            name: "Old Days",
            createdBy: "System",
            description: "Games from before we organized into groups",
            stats: {
                totalGames: 0,
                totalPlayers: 0,
                lastGameDate: null
            }
        });

        console.log(`📝 Created default group: ${defaultGroup.name}`);

        // Update all existing games to belong to the default group
        const gameUpdateResult = await Game.updateMany(
            { groupId: { $exists: false } },
            { $set: { groupId: defaultGroup._id } }
        );

        console.log(`🎮 Updated ${gameUpdateResult.modifiedCount} games`);

        // Update all existing players to belong to the default group
        const playerUpdateResult = await Player.updateMany(
            { groupId: { $exists: false } },
            { $set: { groupId: defaultGroup._id } }
        );

        console.log(`👥 Updated ${playerUpdateResult.modifiedCount} players`);

        // Update all existing leaderboard entries to belong to the default group
        const leaderboardUpdateResult = await Leaderboard.updateMany(
            { groupId: { $exists: false } },
            { $set: { groupId: defaultGroup._id } }
        );

        console.log(`🏆 Updated ${leaderboardUpdateResult.modifiedCount} leaderboard entries`);

        // Update the default group's stats
        const totalGames = await Game.countDocuments({ groupId: defaultGroup._id });
        const uniquePlayersCount = await Player.aggregate([
            { $match: { groupId: defaultGroup._id } },
            { $group: { _id: "$name" } },
            { $count: "totalPlayers" }
        ]);
        const lastGame = await Game.findOne({ groupId: defaultGroup._id })
            .sort({ createdAt: -1 });

        await Group.findByIdAndUpdate(defaultGroup._id, {
            stats: {
                totalGames,
                totalPlayers: uniquePlayersCount[0]?.totalPlayers || 0,
                lastGameDate: lastGame?.createdAt || null
            }
        });

        console.log(`📊 Updated group stats: ${totalGames} games, ${uniquePlayersCount[0]?.totalPlayers || 0} players`);

        console.log("✅ Migration completed successfully!");
        console.log(`🎉 All existing data is now in the "${defaultGroup.name}" group`);
        console.log("📋 Users can now create new groups or continue using the existing group.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateToGroups()
        .then(() => {
            console.log("🎉 Migration script completed!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Migration script failed:", error);
            process.exit(1);
        });
}

export default migrateToGroups;