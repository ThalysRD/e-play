exports.up = (pgm) => {
  pgm.createTable("reviews", {
    id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: '"orders"(id)',
    },
    reviewer_id: {
      type: "integer",
      notNull: true,
      references: '"users"(id)',
    },
    rating: {
      type: "integer",
      notNull: true,
    },
    comment: {
      type: "varchar(255)",
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
