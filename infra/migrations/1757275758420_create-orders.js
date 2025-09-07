exports.up = (pgm) => {
  pgm.createTable("orders", {
    order_id: "id",
    buyer_id: {
      type: "integer",
      notNull: true,
      references: '"users"(user_id)',
    },
    listing_id: {
      type: "integer",
      notNull: true,
      references: '"listings"(listing_id)',
    },
    quantity: {
      type: "integer",
      notNull: true,
    },
    status: {
      type: "varchar(255)",
    },
    order_date: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("orders");
};
