exports.up = (pgm) => {
  pgm.createTable("reviews", {
    review_id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: '"orders"(order_id)',
    },
    reviewer_id: {
      type: "integer",
      notNull: true,
      references: '"users"(user_id)',
    },
    rating: {
      type: "integer",
      notNull: true,
    },
    comment: {
      type: "varchar(255)",
    },
    review_date: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("reviews");
};
