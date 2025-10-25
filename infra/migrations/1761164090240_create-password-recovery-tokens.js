exports.up = (pgm) => {
  pgm.createTable("password_recovery_tokens", {
    id: {
      type: "uuid",
      default: pgm.func("gen_random_uuid()"),
      primaryKey: true,
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
    },
    expires_at: {
      type: "timestamp with time zone",
      notNull: true,
    },
    used_at: {
      type: "timestamp with time zone",
    },
    created_at: {
      type: "timestamp with time zone",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
    updated_at: {
      type: "timestamp with time zone",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
  });

  pgm.createIndex("password_recovery_tokens", "user_id");
  pgm.createIndex("password_recovery_tokens", "expires_at");
}

exports.down = (pgm) => { };
