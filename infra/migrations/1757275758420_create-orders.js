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
    total_price: {
      type: "numeric",
      notNull: true,
    },
    status: {
      type: "varchar(50)",
      notNull: true,
      default: "pending",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("orders");
};
