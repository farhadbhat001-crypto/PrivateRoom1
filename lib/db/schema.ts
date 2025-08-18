import { createId } from "@paralleldrive/cuid2";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Helpers
const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
};

function primaryKeyColumn() {
  return text("id")
    .primaryKey()
    .$defaultFn(() => createId());
}

// ----------------------------
// Tables
// ----------------------------

// User table (from Whop)
export const users = sqliteTable(
  "users",
  {
    id: primaryKeyColumn(),
    whopUserId: text("whop_user_id").notNull().unique(),
    email: text("email"),
    ...timestamps,
  }
);

// Room table (created by creators)
export const rooms = sqliteTable(
  "rooms",
  {
    id: primaryKeyColumn(),
    name: text("name").notNull(),
    price: real("price").notNull(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  }
);

// Purchases (who bought access to which room)
export const purchases = sqliteTable(
  "purchases",
  {
    id: primaryKeyColumn(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    password: text("password").notNull(),
    revoked: integer("revoked").notNull().default(0), // 0 = active, 1 = revoked
    ...timestamps,
  },
  (table) => ({
    uniqueUserRoom: uniqueIndex("unique_user_room").on(
      table.userId,
      table.roomId
    ),
  })
);
