exports.up = (pgm) => {
  pgm.createTable("reviews", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: '"orders"(id)',
    },
    reviewer_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
    },
    rating: {
      type: "integer",
      notNull: true,
    },
    comment: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("reviews");
};
