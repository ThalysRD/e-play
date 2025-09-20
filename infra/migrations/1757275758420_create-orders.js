exports.up = (pgm) => {
  pgm.createTable("orders", {
    id: "id",
    buyer_id: {
      type: "integer",
      notNull: true,
      references: '"users"(id)',
    },
    listing_id: {
      type: "integer",
      notNull: true,
      references: '"listings"(id)',
    },
    quantity: {
      type: "integer",
      notNull: true,
    },
    status: {
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
  pgm.dropTable("orders");
};
